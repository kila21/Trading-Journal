// Client-side filtering/sorting/aggregation for the Trades page. Distinct
// from trade-breakdown-stats.ts (which groups trades into fixed categories
// for Analytics charts) — this narrows a trade list down to a subset the
// trader is browsing, and summarizes that subset.
import { getTradingSession } from "./trading-session";
import { computeAchievedR } from "./trade-stats";
import type { TradeDTO } from "@/types/trade";
import type { TradeSetup } from "@/config/trade-setups";
import type { TradeMistakeTag } from "@/config/trade-mistake-tags";
import type { SessionName } from "@/types/trading-session";

export type TradeOutcome = "win" | "loss";
export type TradeSortField = "tradeDate" | "pnl" | "achievedR";
export type TradeSortDirection = "asc" | "desc";

export interface TradeFilters {
  symbols: string[];
  directions: ("long" | "short")[];
  setups: TradeSetup[];
  includeNoSetup: boolean;
  sessions: SessionName[];
  includeNoSession: boolean;
  mistakeTags: TradeMistakeTag[];
  followedPlan: "any" | "yes" | "no";
  outcomes: TradeOutcome[];
  search: string;
}

export const defaultTradeFilters: TradeFilters = {
  symbols: [],
  directions: [],
  setups: [],
  includeNoSetup: false,
  sessions: [],
  includeNoSession: false,
  mistakeTags: [],
  followedPlan: "any",
  outcomes: [],
  search: "",
};

function tradeOutcome(trade: TradeDTO): TradeOutcome {
  return trade.pnl >= 0 ? "win" : "loss";
}

function tradeSessionName(trade: TradeDTO): SessionName | null {
  return getTradingSession(new Date(trade.tradeDate))?.name ?? null;
}

/**
 * Pure filter — a dimension left at its neutral value (empty array, "any",
 * empty string) matches everything, same no-op convention `ToggleChipGroup`
 * and every other breakdown in this codebase already use.
 */
export function applyTradeFilters(trades: TradeDTO[], filters: TradeFilters): TradeDTO[] {
  return trades.filter((trade) => {
    if (filters.symbols.length > 0 && !filters.symbols.includes(trade.symbol)) return false;
    if (filters.directions.length > 0 && !filters.directions.includes(trade.direction)) return false;

    if (filters.setups.length > 0 || filters.includeNoSetup) {
      const matchesSetup = trade.setup !== null && filters.setups.includes(trade.setup);
      const matchesNoSetup = trade.setup === null && filters.includeNoSetup;
      if (!matchesSetup && !matchesNoSetup) return false;
    }

    if (filters.sessions.length > 0 || filters.includeNoSession) {
      const session = tradeSessionName(trade);
      const matchesSession = session !== null && filters.sessions.includes(session);
      const matchesNoSession = session === null && filters.includeNoSession;
      if (!matchesSession && !matchesNoSession) return false;
    }

    if (
      filters.mistakeTags.length > 0 &&
      !filters.mistakeTags.some((tag) => trade.mistakeTags.includes(tag))
    ) {
      return false;
    }

    if (filters.followedPlan === "yes" && trade.followedPlan !== true) return false;
    if (filters.followedPlan === "no" && trade.followedPlan !== false) return false;

    if (filters.outcomes.length > 0 && !filters.outcomes.includes(tradeOutcome(trade))) return false;

    if (filters.search.trim() !== "") {
      const needle = filters.search.trim().toLowerCase();
      const haystack = `${trade.symbol} ${trade.notes ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
}

export interface FilterOptionCounts {
  symbols: Map<string, number>;
  directions: Record<"long" | "short", number>;
  setups: Map<TradeSetup, number>;
  noSetupCount: number;
  sessions: Map<SessionName, number>;
  noSessionCount: number;
  mistakeTags: Map<TradeMistakeTag, number>;
  outcomes: Record<TradeOutcome, number>;
  followedPlan: { yes: number; no: number };
}

function countBy<T extends string>(trades: TradeDTO[], getValues: (trade: TradeDTO) => T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const trade of trades) {
    for (const value of getValues(trade)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Per-dimension option counts for the filter popovers. Each dimension is
 * counted against trades matching every OTHER active filter (with that one
 * dimension reset to neutral) rather than the raw global total, so counts
 * stay mutually consistent as filters stack — e.g. the Setup popover's counts
 * already reflect an active Session filter, not just the unfiltered range.
 */
export function computeFilterOptionCounts(trades: TradeDTO[], filters: TradeFilters): FilterOptionCounts {
  const without = (overrides: Partial<TradeFilters>) => applyTradeFilters(trades, { ...filters, ...overrides });

  const symbolPool = without({ symbols: [] });
  const directionPool = without({ directions: [] });
  const setupPool = without({ setups: [], includeNoSetup: false });
  const sessionPool = without({ sessions: [], includeNoSession: false });
  const mistakePool = without({ mistakeTags: [] });
  const outcomePool = without({ outcomes: [] });
  const followedPlanPool = without({ followedPlan: "any" });

  return {
    symbols: countBy(symbolPool, (t) => [t.symbol]),
    directions: {
      long: directionPool.filter((t) => t.direction === "long").length,
      short: directionPool.filter((t) => t.direction === "short").length,
    },
    setups: countBy(setupPool, (t) => (t.setup !== null ? [t.setup] : [])),
    noSetupCount: setupPool.filter((t) => t.setup === null).length,
    sessions: countBy(sessionPool, (t) => {
      const name = tradeSessionName(t);
      return name ? [name] : [];
    }),
    noSessionCount: sessionPool.filter((t) => tradeSessionName(t) === null).length,
    mistakeTags: countBy(mistakePool, (t) => t.mistakeTags),
    outcomes: {
      win: outcomePool.filter((t) => tradeOutcome(t) === "win").length,
      loss: outcomePool.filter((t) => tradeOutcome(t) === "loss").length,
    },
    followedPlan: {
      yes: followedPlanPool.filter((t) => t.followedPlan === true).length,
      no: followedPlanPool.filter((t) => t.followedPlan === false).length,
    },
  };
}

export interface TradesSummary {
  count: number;
  winRate: number | null;
  avgAchievedR: number | null;
  totalPnl: number;
}

/** Footer-row aggregate for the currently filtered/sorted trade list. */
export function computeTradesSummary(trades: TradeDTO[]): TradesSummary {
  const count = trades.length;
  const wins = trades.filter((t) => t.pnl >= 0).length;
  const achievedRs = trades.map(computeAchievedR).filter((r): r is number => r !== null);

  return {
    count,
    winRate: count > 0 ? Math.round((wins / count) * 100) : null,
    avgAchievedR: achievedRs.length > 0 ? achievedRs.reduce((sum, r) => sum + r, 0) / achievedRs.length : null,
    totalPnl: trades.reduce((sum, t) => sum + t.pnl, 0),
  };
}

/** Pure sort — missing achievedR always sorts last regardless of direction, so unratable trades don't jump to the top on desc. */
export function sortTrades(trades: TradeDTO[], field: TradeSortField, direction: TradeSortDirection): TradeDTO[] {
  const sign = direction === "asc" ? 1 : -1;

  return [...trades].sort((a, b) => {
    if (field === "tradeDate") return a.tradeDate.localeCompare(b.tradeDate) * sign;
    if (field === "pnl") return (a.pnl - b.pnl) * sign;

    const rA = computeAchievedR(a);
    const rB = computeAchievedR(b);
    if (rA === null && rB === null) return 0;
    if (rA === null) return 1;
    if (rB === null) return -1;
    return (rA - rB) * sign;
  });
}
