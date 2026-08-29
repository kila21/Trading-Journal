// Aggregates trades into per-day P&L stats and derives month-level summaries
// (best/worst day, current streak, equity curve, max drawdown), plus
// per-trade quality metrics (hold duration, planned/achieved R) and
// portfolio-wide ratios and distributions (profit factor, expectancy,
// expectancy in R, achieved-R histogram, hold-time buckets, consecutive
// win/loss streaks). Multi-trade breakdowns by setup/session/symbol/direction/
// weekday/hour/mistake-tags/plan-adherence live in trade-breakdown-stats.ts.
import type {
  TradeDTO,
  DailyStats,
  MonthSummary,
  EquityPoint,
  WinLossBreakdown,
  WeekSummary,
  RBucket,
  HoldTimeComparison,
  HoldBucket,
  ConsecutiveStreaks,
} from "@/types/trade";
import type { CalendarDay } from "@/types/calendar";
import { resolvePointValue } from "@/config/instrument-specs";

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

/**
 * Sums DailyStats for the days in `week` that belong to the currently
 * displayed month — the same isCurrentMonth gate calendar.tsx already uses
 * when looking up a single day's stats, which is what keeps this safe from
 * groupTradesByDay's day-of-month-only keys colliding with the leading/
 * trailing days from adjacent months. Null when the week had no trades.
 */
export function computeWeekSummary(week: CalendarDay[], dailyStats: Map<number, DailyStats>): WeekSummary | null {
  let pnl = 0;
  let trades = 0;
  let wins = 0;

  for (const day of week) {
    if (!day.isCurrentMonth) continue;
    const stats = dailyStats.get(day.day);
    if (!stats) continue;
    pnl += stats.pnl;
    trades += stats.trades;
    wins += stats.wins;
  }

  return trades > 0 ? { pnl, trades, wins } : null;
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
 * Minutes between trade open and close. `exitDate` can fall on a later
 * calendar day than `tradeDate` (swing/overnight holds), so this is a plain
 * timestamp difference. Null when exitDate isn't set (old trades, or a trade
 * whose exit time wasn't recorded) — there's no "0 minutes" fallback since
 * that would misleadingly imply an instant trade.
 */
export function computeHoldDurationMinutes(trade: TradeDTO): number | null {
  if (!trade.exitDate) return null;
  const ms = new Date(trade.exitDate).getTime() - new Date(trade.tradeDate).getTime();
  return Math.round(ms / 60000);
}

/** Compact hold duration: `45m`, `3h 12m`, or `2d 6h` for multi-day holds. */
export function formatDuration(minutes: number): string {
  const sign = minutes < 0 ? "-" : "";
  const total = Math.abs(minutes);
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const mins = total % 60;
  if (days > 0) return `${sign}${days}d ${hours}h`;
  if (hours > 0) return `${sign}${hours}h ${mins}m`;
  return `${sign}${mins}m`;
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
 * leveraged crypto) that silently produces a meaningless number. The price
 * ratio avoids that dependency and stays directly comparable to planned R.
 *
 * Note: with a resolved point value (src/config/instrument-specs.ts), the
 * dollar form `pnl / computeDollarRisk(trade)` reduces to this same ratio —
 * the point value and contract count cancel out of numerator and denominator
 * — so "achieved R" stays a single number regardless of unit. Null under the
 * same missing-stop / zero-risk condition as computePlannedR.
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
 * Dollar risk on a trade: entry-to-stop price distance × the resolved point
 * value × contract count. Null when there's no stop, the stop sits on entry,
 * or no point value resolves for the symbol/size (and no per-trade override).
 */
export function computeDollarRisk(trade: TradeDTO): number | null {
  if (trade.stopLoss === null) return null;
  const pointValue = resolvePointValue(trade.symbol, trade.contractSize);
  if (pointValue === null) return null;
  const distance = Math.abs(trade.entryPrice - trade.stopLoss);
  if (distance === 0) return null;
  return distance * pointValue * trade.contracts;
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

/**
 * Risk as a percentage of account balance, from the trader's manually-
 * entered `riskAmount` (see prisma/schema.prisma for why this isn't derived
 * from stop-loss distance). Null when either side of the ratio is missing
 * or the balance is zero.
 */
export function computeRiskPercent(trade: TradeDTO, accountBalance: number | null): number | null {
  if (trade.riskAmount === null || accountBalance === null || accountBalance === 0) return null;
  return (trade.riskAmount / accountBalance) * 100;
}

/** Average risk % across trades that have both a riskAmount and a usable account balance. */
export function computeAverageRiskPercent(trades: TradeDTO[], accountBalance: number | null): number | null {
  const percents = trades
    .map((trade) => computeRiskPercent(trade, accountBalance))
    .filter((value): value is number => value !== null);
  return percents.length > 0 ? percents.reduce((sum, value) => sum + value, 0) / percents.length : null;
}

// Half-open bucket edges for the achieved-R distribution: a trade's R lands in
// the first bucket whose edge it's `<=`, or the open-ended top bucket if it
// exceeds them all. Breakeven (0R) falls in the `(-1, 0]` bucket.
const R_BUCKET_EDGES = [-2, -1, 0, 1, 2, 3];

/**
 * Achieved-R histogram: one bucket per R_BUCKET_EDGES interval plus an open
 * end on each side, each carrying its trade count and total P&L. Trades with
 * no achieved R (missing stop / zero risk) are skipped.
 */
export function computeRMultipleDistribution(trades: TradeDTO[]): RBucket[] {
  const buckets: RBucket[] = [];
  for (let i = 0; i <= R_BUCKET_EDGES.length; i++) {
    buckets.push({
      key: `r${i}`,
      min: i === 0 ? null : R_BUCKET_EDGES[i - 1],
      max: i === R_BUCKET_EDGES.length ? null : R_BUCKET_EDGES[i],
      count: 0,
      totalPnl: 0,
    });
  }

  for (const trade of trades) {
    const r = computeAchievedR(trade);
    if (r === null) continue;
    let index = R_BUCKET_EDGES.findIndex((edge) => r <= edge);
    if (index === -1) index = R_BUCKET_EDGES.length;
    buckets[index].count += 1;
    buckets[index].totalPnl += trade.pnl;
  }

  return buckets;
}

/** Mean achieved R across trades that have one — expectancy expressed in R. Null when none do. */
export function computeExpectancyR(trades: TradeDTO[]): number | null {
  const values = trades.map(computeAchievedR).filter((r): r is number => r !== null);
  return values.length > 0 ? values.reduce((sum, r) => sum + r, 0) / values.length : null;
}

/**
 * Average hold duration (minutes) for winning vs losing trades. Trades with no
 * recorded exit time are ignored; each side is null independently when it has
 * no such trade.
 */
export function computeHoldTimeComparison(trades: TradeDTO[]): HoldTimeComparison {
  const winners: number[] = [];
  const losers: number[] = [];
  for (const trade of trades) {
    const minutes = computeHoldDurationMinutes(trade);
    if (minutes === null) continue;
    (trade.pnl >= 0 ? winners : losers).push(minutes);
  }
  const average = (values: number[]) =>
    values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  return { avgWinnerMinutes: average(winners), avgLoserMinutes: average(losers) };
}

const HOLD_BUCKET_ORDER = ["lt15", "15to60", "1to4h", "4to24h", "gt1d"] as const;

function holdBucketKey(minutes: number): (typeof HOLD_BUCKET_ORDER)[number] {
  if (minutes < 15) return "lt15";
  if (minutes < 60) return "15to60";
  if (minutes < 240) return "1to4h";
  if (minutes < 1440) return "4to24h";
  return "gt1d";
}

/**
 * Trades grouped into hold-duration buckets (`<15m`, `15–60m`, `1–4h`,
 * `4–24h`, `>1d`), each with win rate and total P&L. Only buckets with at
 * least one trade are returned; trades with no exit time are excluded.
 */
export function computeHoldTimeBuckets(trades: TradeDTO[]): HoldBucket[] {
  const map = new Map<string, HoldBucket>(
    HOLD_BUCKET_ORDER.map((key) => [key, { key, trades: 0, wins: 0, winRate: 0, totalPnl: 0 }]),
  );

  for (const trade of trades) {
    const minutes = computeHoldDurationMinutes(trade);
    if (minutes === null) continue;
    const bucket = map.get(holdBucketKey(minutes))!;
    bucket.trades += 1;
    if (trade.pnl >= 0) bucket.wins += 1;
    bucket.totalPnl += trade.pnl;
  }

  return HOLD_BUCKET_ORDER.map((key) => {
    const bucket = map.get(key)!;
    return { ...bucket, winRate: bucket.trades > 0 ? bucket.wins / bucket.trades : 0 };
  }).filter((bucket) => bucket.trades > 0);
}

/**
 * Longest run of consecutive winning and losing trades in chronological order,
 * plus the run currently in progress. Trade-level and sign-based (`pnl >= 0` =
 * win, consistent with computeStreak/groupTradesByDay) — distinct from the
 * calendar-day streak in computeMonthSummary.
 */
export function computeConsecutiveStreaks(trades: TradeDTO[]): ConsecutiveStreaks {
  const sorted = [...trades].sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));

  let maxWins = 0;
  let maxLosses = 0;
  let runType: "win" | "loss" | null = null;
  let runCount = 0;

  for (const trade of sorted) {
    const type: "win" | "loss" = trade.pnl >= 0 ? "win" : "loss";
    if (type === runType) {
      runCount += 1;
    } else {
      runType = type;
      runCount = 1;
    }
    if (type === "win") maxWins = Math.max(maxWins, runCount);
    else maxLosses = Math.max(maxLosses, runCount);
  }

  return { maxWins, maxLosses, current: runType === null ? null : { type: runType, count: runCount } };
}
