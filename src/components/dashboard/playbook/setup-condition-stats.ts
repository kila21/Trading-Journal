// Per-condition and overall-compliance performance for one setup's trades —
// answers "when I lost, what did I skip? when I won, what did I actually do?"
// checkedConditions on each trade is a text snapshot (see prisma/schema.prisma),
// so a condition only counts as "checked" on trades where its exact text was
// checked at the time — renaming a condition breaks the historical match,
// same soft-reference tradeoff already accepted for Trade.setup itself.
import type { TradeDTO } from "@/types/trade";

function winRate(trades: TradeDTO[]): number | null {
  return trades.length > 0 ? trades.filter((t) => t.pnl >= 0).length / trades.length : null;
}

function totalPnl(trades: TradeDTO[]): number {
  return trades.reduce((sum, t) => sum + t.pnl, 0);
}

export interface ConditionStatRow {
  condition: string;
  checkedTrades: number;
  checkedWinRate: number | null;
  checkedTotalPnl: number;
  uncheckedTrades: number;
  uncheckedWinRate: number | null;
  uncheckedTotalPnl: number;
}

/** One row per current condition, splitting this setup's trades into "checked" vs "not checked" for that condition. */
export function computeConditionBreakdown(trades: TradeDTO[], conditions: string[]): ConditionStatRow[] {
  return conditions.map((condition) => {
    const checked = trades.filter((t) => t.checkedConditions.includes(condition));
    const unchecked = trades.filter((t) => !t.checkedConditions.includes(condition));
    return {
      condition,
      checkedTrades: checked.length,
      checkedWinRate: winRate(checked),
      checkedTotalPnl: totalPnl(checked),
      uncheckedTrades: unchecked.length,
      uncheckedWinRate: winRate(unchecked),
      uncheckedTotalPnl: totalPnl(unchecked),
    };
  });
}

export interface ConditionComplianceGroup {
  trades: number;
  winRate: number | null;
  totalPnl: number;
}

export interface ConditionComplianceSplit {
  allMet: ConditionComplianceGroup;
  partial: ConditionComplianceGroup;
}

/**
 * Splits a setup's trades into "every current condition was checked" vs "at
 * least one wasn't" — a quick read on whether skipping checklist items
 * actually costs money. A trade logged before a condition was added or
 * renamed can land in "partial" even if the trader did everything right at
 * the time, same caveat as computeConditionBreakdown above.
 */
export function computeConditionComplianceSplit(trades: TradeDTO[], conditions: string[]): ConditionComplianceSplit {
  const allMetTrades = trades.filter((t) => conditions.every((c) => t.checkedConditions.includes(c)));
  const partialTrades = trades.filter((t) => !conditions.every((c) => t.checkedConditions.includes(c)));
  return {
    allMet: { trades: allMetTrades.length, winRate: winRate(allMetTrades), totalPnl: totalPnl(allMetTrades) },
    partial: { trades: partialTrades.length, winRate: winRate(partialTrades), totalPnl: totalPnl(partialTrades) },
  };
}
