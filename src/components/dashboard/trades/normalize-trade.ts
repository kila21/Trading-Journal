import type { TradeDTO } from "@/types/trade";

/**
 * Fills in safe defaults for fields that may be missing on a trade coming over
 * the wire — old rows created before a column existed, or a response from a
 * dev server whose Prisma client hasn't been regenerated yet. Keeps the rest
 * of the app free of `trade.emotions?.length` style guards.
 */
export function normalizeTrade(raw: unknown): TradeDTO {
  const trade = raw as TradeDTO;
  return {
    ...trade,
    mistakeTags: trade.mistakeTags ?? [],
    emotions: trade.emotions ?? [],
    checkedConditions: trade.checkedConditions ?? [],
  };
}

export function normalizeTrades(raw: unknown): TradeDTO[] {
  return Array.isArray(raw) ? raw.map(normalizeTrade) : [];
}
