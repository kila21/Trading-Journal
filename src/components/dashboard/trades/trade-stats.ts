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
