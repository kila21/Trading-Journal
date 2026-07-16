// Aggregates trades into per-day P&L stats and derives month-level summaries
// (best/worst day, current streak, equity curve, max drawdown).
import type { TradeDTO, DailyStats, MonthSummary, EquityPoint } from "@/types/trade";

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

/**
 * Largest peak-to-trough decline in cumulative P&L, as a dollar amount
 * (negative, or 0 when the equity curve never dips below a prior high).
 */
export function computeMaxDrawdown(trades: TradeDTO[]): number {
  let peak = 0;
  let maxDrawdown = 0;
  for (const { value } of buildEquityCurve(trades)) {
    peak = Math.max(peak, value);
    maxDrawdown = Math.min(maxDrawdown, value - peak);
  }
  return maxDrawdown;
}
