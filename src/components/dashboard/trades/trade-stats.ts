// Aggregates trades into per-day P&L stats and derives month-level summaries
// (best/worst day, current streak, equity curve, max drawdown), plus
// per-trade quality metrics (hold duration, planned/achieved R) and simple
// portfolio-wide ratios (profit factor, expectancy). Multi-trade breakdowns
// by setup/mistake-tags/plan-adherence live in trade-breakdown-stats.ts.
import type { TradeDTO, DailyStats, MonthSummary, EquityPoint, WinLossBreakdown } from "@/types/trade";

export function groupTradesByDay(trades: TradeDTO[]): Map<number, DailyStats> {
  const stats = new Map<number, DailyStats>();

  for (const trade of trades) {
    const day = new Date(trade.tradeDate).getDate();
    const existing = stats.get(day) ?? { pnl: 0, trades: 0, wins: 0, firstTradeDate: trade.tradeDate };

    existing.pnl += trade.pnl;
    existing.trades += 1;
    if (trade.pnl >= 0) existing.wins += 1;
    if (trade.tradeDate < existing.firstTradeDate) existing.firstTradeDate = trade.tradeDate;

    stats.set(day, existing);
  }

  return stats;
}

export function computeMonthSummary(dailyStats: Map<number, DailyStats>): MonthSummary {
  let bestDay: MonthSummary["bestDay"] = null;
  let worstDay: MonthSummary["worstDay"] = null;
  for (const [day, stats] of dailyStats) {
    if (!bestDay || stats.pnl > bestDay.pnl) bestDay = { day, pnl: stats.pnl };
    // A "worst day" only makes sense as an actual loss — a month with no
    // losing day shouldn't have its smallest win mislabeled as the worst one.
    if (stats.pnl < 0 && (!worstDay || stats.pnl < worstDay.pnl)) worstDay = { day, pnl: stats.pnl };
  }

  return { bestDay, worstDay, streak: computeStreak(dailyStats) };
}

/**
 * Walks days-with-trades from most recent backward, counting how many in a
 * row share the same win/loss sign. Only keys present in `dailyStats` are
 * considered, so zero-trade calendar days are already skipped — the streak
 * measures consecutive trading days, not consecutive calendar days.
 */
function computeStreak(dailyStats: Map<number, DailyStats>): MonthSummary["streak"] {
  const days = Array.from(dailyStats.keys()).sort((a, b) => b - a);
  if (days.length === 0) return null;

  const type: "win" | "loss" = dailyStats.get(days[0])!.pnl >= 0 ? "win" : "loss";
  let count = 0;
  for (const day of days) {
    const isWin = dailyStats.get(day)!.pnl >= 0;
    if ((type === "win") !== isWin) break;
    count++;
  }
  return { type, count };
}

/**
 * Cumulative P&L after each trade, in chronological order, prefixed with a
 * synthetic point-0 baseline at $0 so the curve always starts from the
 * y-axis origin. Trade-level (not day-level) so same-day trades still show
 * as separate steps — a day-bucketed sum would hide an intra-day dip.
 */
function buildEquityCurve(trades: TradeDTO[]): EquityPoint[] {
  const sorted = [...trades].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
  const points: EquityPoint[] = [{ point: 0, value: 0 }];
  let running = 0;
  for (const trade of sorted) {
    running += trade.pnl;
    points.push({ point: points.length, value: running });
  }
  return points;
}

export function computeEquityCurve(trades: TradeDTO[]): EquityPoint[] {
  return buildEquityCurve(trades);
}

export interface DrawdownDetail {
  amount: number; // dollar drawdown, negative or 0
  percent: number | null; // amount as a % of the peak it fell from; null when the peak is $0 (undefined %)
}

/**
 * Largest peak-to-trough decline in cumulative P&L, both as a dollar amount
 * (negative, or 0 when the equity curve never dips below a prior high) and
 * as a percentage of the peak equity it fell from.
 */
export function computeMaxDrawdownDetail(trades: TradeDTO[]): DrawdownDetail {
  let peak = 0;
  let maxDrawdown = 0;
  let peakAtMaxDrawdown = 0;
  for (const { value } of buildEquityCurve(trades)) {
    peak = Math.max(peak, value);
    const drawdown = value - peak;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      peakAtMaxDrawdown = peak;
    }
  }
  return { amount: maxDrawdown, percent: peakAtMaxDrawdown !== 0 ? (maxDrawdown / peakAtMaxDrawdown) * 100 : null };
}

export function computeMaxDrawdown(trades: TradeDTO[]): number {
  return computeMaxDrawdownDetail(trades).amount;
}

/**
 * Minutes between trade open and close. Null when exitDate isn't set (old
 * trades, or a trade whose exit time wasn't recorded) — there's no "0
 * minutes" fallback since that would misleadingly imply an instant trade.
 */
export function computeHoldDurationMinutes(trade: TradeDTO): number | null {
  if (!trade.exitDate) return null;
  const ms = new Date(trade.exitDate).getTime() - new Date(trade.tradeDate).getTime();
  return Math.round(ms / 60000);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60);
  const mins = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? "-" : "";
  return hours > 0 ? `${sign}${hours}h ${mins}m` : `${sign}${mins}m`;
}

/**
 * Reward-to-risk ratio as planned before entry: distance to target over
 * distance to stop. Null when stop loss or take profit is missing, or the
 * stop sits on entry (zero risk) — there's no meaningful R without both a
 * defined risk and a defined reward.
 */
export function computePlannedR(trade: TradeDTO): number | null {
  if (trade.stopLoss === null || trade.takeProfit === null) return null;
  const risk = Math.abs(trade.entryPrice - trade.stopLoss);
  if (risk === 0) return null;
  return Math.abs(trade.takeProfit - trade.entryPrice) / risk;
}

/**
 * Realized reward-to-risk ratio: actual price movement in the trade's favor
 * over the planned entry-to-stop distance — the same price-distance math as
 * computePlannedR, deliberately not derived from pnl/contracts. A dollar-based
 * version (pnl / (riskPerUnit * contracts)) only holds for instruments priced
 * at exactly $1-per-point-per-contract; for anything else (gold, forex,
 * leveraged crypto) that silently produces a meaningless number, since this
 * app has no per-instrument point-value/multiplier to convert price distance
 * into dollars correctly. Price-ratio avoids that dependency entirely and
 * stays directly comparable to planned R. Null under the same missing-stop /
 * zero-risk condition as computePlannedR.
 */
export function computeAchievedR(trade: TradeDTO): number | null {
  if (trade.stopLoss === null) return null;
  const risk = Math.abs(trade.entryPrice - trade.stopLoss);
  if (risk === 0) return null;
  const favorableMove =
    trade.direction === "long" ? trade.exitPrice - trade.entryPrice : trade.entryPrice - trade.exitPrice;
  return favorableMove / risk;
}

export function formatRMultiple(value: number): string {
  return `${value.toFixed(2)}R`;
}

/**
 * Gross profit over gross loss (absolute value). Null when there are no
 * losing trades — the ratio is undefined, not infinite.
 */
export function computeProfitFactor(trades: TradeDTO[]): number | null {
  const grossWins = trades.filter((t) => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const grossLosses = Math.abs(trades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
  if (grossLosses === 0) return null;
  return grossWins / grossLosses;
}

/**
 * Average win, average loss, the single largest win, and the win/loss ratio
 * (avgWin / |avgLoss|) — the "Wins vs losses" card's raw material. Each half
 * is null independently when there are no trades on that side, since an
 * average of zero trades isn't a meaningful $0.
 */
export function computeWinLossBreakdown(trades: TradeDTO[]): WinLossBreakdown {
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);

  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : null;
  const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length : null;

  const largestWin = wins.reduce<TradeDTO | null>(
    (best, t) => (best === null || t.pnl > best.pnl ? t : best),
    null,
  );

  return {
    avgWin,
    winCount: wins.length,
    avgLoss,
    lossCount: losses.length,
    largestWin:
      largestWin === null
        ? null
        : { pnl: largestWin.pnl, symbol: largestWin.symbol, tradeDate: largestWin.tradeDate },
    ratio: avgWin !== null && avgLoss !== null && avgLoss !== 0 ? avgWin / Math.abs(avgLoss) : null,
  };
}

/** Average expected P&L per trade: (winRate * avgWin) - (lossRate * avgLoss). */
export function computeExpectancy(trades: TradeDTO[]): number | null {
  if (trades.length === 0) return null;
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const winRate = wins.length / trades.length;
  const lossRate = losses.length / trades.length;
  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0)) / losses.length : 0;
  return winRate * avgWin - lossRate * avgLoss;
}
