import type { TradeDTO } from "./use-month-trades";

export interface DailyStats {
  pnl: number;
  trades: number;
  wins: number;
}

export function groupTradesByDay(trades: TradeDTO[]): Map<number, DailyStats> {
  const stats = new Map<number, DailyStats>();

  for (const trade of trades) {
    const day = new Date(trade.tradeDate).getDate();
    const existing = stats.get(day) ?? { pnl: 0, trades: 0, wins: 0 };

    existing.pnl += trade.pnl;
    existing.trades += 1;
    if (trade.pnl >= 0) existing.wins += 1;

    stats.set(day, existing);
  }

  return stats;
}

export interface MonthSummary {
  bestDay: { day: number; pnl: number } | null;
  worstDay: { day: number; pnl: number } | null;
  streak: { type: "win" | "loss"; count: number } | null;
}

export function computeMonthSummary(dailyStats: Map<number, DailyStats>): MonthSummary {
  let bestDay: MonthSummary["bestDay"] = null;
  let worstDay: MonthSummary["worstDay"] = null;
  for (const [day, stats] of dailyStats) {
    if (!bestDay || stats.pnl > bestDay.pnl) bestDay = { day, pnl: stats.pnl };
    if (!worstDay || stats.pnl < worstDay.pnl) worstDay = { day, pnl: stats.pnl };
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
