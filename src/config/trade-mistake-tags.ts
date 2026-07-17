// Fixed multi-select vocabulary for tagging execution mistakes on a trade.
// Values render verbatim in the UI (no i18n keys), same rationale as
// trade-setups.ts.
export const tradeMistakeTags = [
  "Entered early",
  "Moved stop",
  "No confirmation",
  "Oversized",
  "Revenge trade",
  "Chased",
  "Bad market conditions",
  "Overtrading",
  "Ignored trend",
  "FOMO",
] as const;

export type TradeMistakeTag = (typeof tradeMistakeTags)[number];
