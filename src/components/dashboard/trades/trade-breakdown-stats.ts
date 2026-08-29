// Multi-trade breakdowns for the Analytics page — grouping by setup, session,
// symbol, direction, weekday, hour, mistake tag, emotion, and plan adherence.
// Distinct from trade-stats.ts, which aggregates by calendar day/month for the
// Overview page.
import { tradeMistakeTags } from "@/config/trade-mistake-tags";
import { tradeEmotions } from "@/config/trade-emotions";
import { computeAchievedR } from "./trade-stats";
import { getTradingSession } from "./trading-session";
import type {
  TradeDTO,
  SetupBreakdownRow,
  SessionBreakdownRow,
  FollowedPlanComparison,
  MistakeCostRow,
  SymbolBreakdownRow,
  DirectionRow,
  DayOfWeekRow,
  HourOfDayRow,
  EmotionBreakdownRow,
} from "@/types/trade";

function averageAchievedR(trades: TradeDTO[]): number | null {
  const values = trades.map(computeAchievedR).filter((r): r is number => r !== null);
  return values.length > 0 ? values.reduce((sum, r) => sum + r, 0) / values.length : null;
}

/**
 * Win rate + expectancy + total P&L per setup, for trades that have a setup
 * tag. Setups with zero trades this month are omitted (an empty row for
 * every untouched playbook entry isn't useful signal). Sorted by total P&L
 * descending — most impactful setups first.
 */
export function computeSetupBreakdown(trades: TradeDTO[]): SetupBreakdownRow[] {
  const bySetup = new Map<string, TradeDTO[]>();
  for (const trade of trades) {
    if (!trade.setup) continue;
    const existing = bySetup.get(trade.setup) ?? [];
    existing.push(trade);
    bySetup.set(trade.setup, existing);
  }

  const rows: SetupBreakdownRow[] = Array.from(bySetup.entries()).map(([setup, setupTrades]) => {
    const wins = setupTrades.filter((t) => t.pnl >= 0).length;
    const totalPnl = setupTrades.reduce((sum, t) => sum + t.pnl, 0);
    return {
      setup: setup as SetupBreakdownRow["setup"],
      trades: setupTrades.length,
      wins,
      winRate: wins / setupTrades.length,
      totalPnl,
      expectancy: totalPnl / setupTrades.length,
    };
  });

  return rows.sort((a, b) => b.totalPnl - a.totalPnl);
}

/**
 * Win rate + total P&L per trading session, resolved from each trade's
 * tradeDate — no setup tag required, this is "free" data every trade
 * already has. Trades outside every Kill Zone bucket under a `session: null`
 * row rather than being dropped, so the "no session" cost/benefit is visible
 * too. Sorted by total P&L descending, same convention as the setup
 * breakdown.
 */
export function computeSessionBreakdown(trades: TradeDTO[]): SessionBreakdownRow[] {
  const bySession = new Map<string, TradeDTO[]>();
  for (const trade of trades) {
    const session = getTradingSession(new Date(trade.tradeDate));
    const key = session?.name ?? "none";
    const existing = bySession.get(key) ?? [];
    existing.push(trade);
    bySession.set(key, existing);
  }

  const rows: SessionBreakdownRow[] = Array.from(bySession.entries()).map(([key, sessionTrades]) => {
    const wins = sessionTrades.filter((t) => t.pnl >= 0).length;
    const totalPnl = sessionTrades.reduce((sum, t) => sum + t.pnl, 0);
    return {
      session: key === "none" ? null : (key as SessionBreakdownRow["session"]),
      trades: sessionTrades.length,
      wins,
      winRate: wins / sessionTrades.length,
      totalPnl,
    };
  });

  return rows.sort((a, b) => b.totalPnl - a.totalPnl);
}

/**
 * Followed vs broke the plan, each with total P&L and average achieved R.
 * Trades where followedPlan was never recorded (null) are excluded — this
 * comparison only makes sense for trades where the trader actually logged
 * an answer.
 */
export function computeFollowedPlanComparison(trades: TradeDTO[]): FollowedPlanComparison {
  const followed = trades.filter((t) => t.followedPlan === true);
  const notFollowed = trades.filter((t) => t.followedPlan === false);
  return {
    followed: {
      trades: followed.length,
      totalPnl: followed.reduce((sum, t) => sum + t.pnl, 0),
      avgAchievedR: averageAchievedR(followed),
    },
    notFollowed: {
      trades: notFollowed.length,
      totalPnl: notFollowed.reduce((sum, t) => sum + t.pnl, 0),
      avgAchievedR: averageAchievedR(notFollowed),
    },
  };
}

/**
 * Total P&L across every trade tagged with each mistake. A trade with
 * multiple mistake tags contributes to each of that trade's rows — this is
 * per-tag cost attribution, not a mutually exclusive partition of trades.
 * Only mistakes with at least one trade appear, sorted worst-cost first.
 */
export function computeMistakeCostBreakdown(trades: TradeDTO[]): MistakeCostRow[] {
  const rows: MistakeCostRow[] = tradeMistakeTags
    .map((tag) => {
      const tagged = trades.filter((t) => t.mistakeTags.includes(tag));
      return { tag, trades: tagged.length, totalPnl: tagged.reduce((sum, t) => sum + t.pnl, 0) };
    })
    .filter((row) => row.trades > 0);

  return rows.sort((a, b) => a.totalPnl - b.totalPnl);
}

/**
 * Win rate + total P&L per logged emotion. A trade tagged with several
 * emotions contributes to each row (not a mutually exclusive partition).
 * Only emotions with at least one trade appear; sorted by total P&L
 * descending (best-feeling states first).
 */
export function computeEmotionBreakdown(trades: TradeDTO[]): EmotionBreakdownRow[] {
  const rows: EmotionBreakdownRow[] = tradeEmotions
    .map((emotion) => {
      const tagged = trades.filter((t) => (t.emotions ?? []).includes(emotion));
      const wins = tagged.filter((t) => t.pnl >= 0).length;
      return {
        emotion,
        trades: tagged.length,
        wins,
        winRate: tagged.length > 0 ? wins / tagged.length : 0,
        totalPnl: tagged.reduce((sum, t) => sum + t.pnl, 0),
      };
    })
    .filter((row) => row.trades > 0);

  return rows.sort((a, b) => b.totalPnl - a.totalPnl);
}

/**
 * Win rate + expectancy + total P&L per symbol — same shape as the setup
 * breakdown but every trade has a symbol, so nothing is dropped. Sorted by
 * total P&L descending.
 */
export function computeSymbolBreakdown(trades: TradeDTO[]): SymbolBreakdownRow[] {
  const bySymbol = new Map<string, TradeDTO[]>();
  for (const trade of trades) {
    const existing = bySymbol.get(trade.symbol) ?? [];
    existing.push(trade);
    bySymbol.set(trade.symbol, existing);
  }

  const rows: SymbolBreakdownRow[] = Array.from(bySymbol.entries()).map(([symbol, symbolTrades]) => {
    const wins = symbolTrades.filter((t) => t.pnl >= 0).length;
    const totalPnl = symbolTrades.reduce((sum, t) => sum + t.pnl, 0);
    return {
      symbol,
      trades: symbolTrades.length,
      wins,
      winRate: wins / symbolTrades.length,
      totalPnl,
      expectancy: totalPnl / symbolTrades.length,
    };
  });

  return rows.sort((a, b) => b.totalPnl - a.totalPnl);
}

/**
 * Long vs short: win rate, total P&L, and average achieved R for each
 * direction. A direction with no trades is omitted. Sorted by total P&L
 * descending.
 */
export function computeDirectionBreakdown(trades: TradeDTO[]): DirectionRow[] {
  const rows: DirectionRow[] = (["long", "short"] as const)
    .map((direction) => {
      const directionTrades = trades.filter((t) => t.direction === direction);
      const wins = directionTrades.filter((t) => t.pnl >= 0).length;
      return {
        direction,
        trades: directionTrades.length,
        wins,
        winRate: directionTrades.length > 0 ? wins / directionTrades.length : 0,
        totalPnl: directionTrades.reduce((sum, t) => sum + t.pnl, 0),
        avgAchievedR: averageAchievedR(directionTrades),
      };
    })
    .filter((row) => row.trades > 0);

  return rows.sort((a, b) => b.totalPnl - a.totalPnl);
}

/**
 * Win rate + total P&L per weekday, Monday=0..Sunday=6 (matches the calendar
 * grid). Uses the trade's local wall-clock day as entered — deliberately not
 * NY/exchange time like getTradingSession, since this is about the trader's
 * own weekly rhythm. Only weekdays with trades appear; sorted Mon→Sun.
 */
export function computeDayOfWeekBreakdown(trades: TradeDTO[]): DayOfWeekRow[] {
  const byWeekday = new Map<number, TradeDTO[]>();
  for (const trade of trades) {
    const weekday = (new Date(trade.tradeDate).getDay() + 6) % 7;
    const existing = byWeekday.get(weekday) ?? [];
    existing.push(trade);
    byWeekday.set(weekday, existing);
  }

  const rows: DayOfWeekRow[] = Array.from(byWeekday.entries()).map(([weekday, dayTrades]) => {
    const wins = dayTrades.filter((t) => t.pnl >= 0).length;
    return {
      weekday,
      trades: dayTrades.length,
      wins,
      winRate: wins / dayTrades.length,
      totalPnl: dayTrades.reduce((sum, t) => sum + t.pnl, 0),
    };
  });

  return rows.sort((a, b) => a.weekday - b.weekday);
}

/**
 * Win rate + total P&L per entry hour (local wall-clock, 0..23). Only hours
 * with trades appear; sorted earliest→latest.
 */
export function computeHourOfDayBreakdown(trades: TradeDTO[]): HourOfDayRow[] {
  const byHour = new Map<number, TradeDTO[]>();
  for (const trade of trades) {
    const hour = new Date(trade.tradeDate).getHours();
    const existing = byHour.get(hour) ?? [];
    existing.push(trade);
    byHour.set(hour, existing);
  }

  const rows: HourOfDayRow[] = Array.from(byHour.entries()).map(([hour, hourTrades]) => {
    const wins = hourTrades.filter((t) => t.pnl >= 0).length;
    return {
      hour,
      trades: hourTrades.length,
      wins,
      winRate: wins / hourTrades.length,
      totalPnl: hourTrades.reduce((sum, t) => sum + t.pnl, 0),
    };
  });

  return rows.sort((a, b) => a.hour - b.hour);
}
