// Fixed multi-select vocabulary for how the trader felt going into / during a
// trade. Values render verbatim in the UI (no i18n keys), same rationale as
// trade-mistake-tags.ts. Kept to feeling-states — the *actions* those feelings
// led to (revenge trade, chased, overtrading…) live in trade-mistake-tags.ts.
// Set mirrors what Edgewonk / TradesViz / Tradervue surface for trade psychology.
export const tradeEmotions = [
  "Calm",
  "Focused",
  "Confident",
  "Excited",
  "Anxious",
  "Fearful",
  "Greedy",
  "FOMO",
  "Frustrated",
  "Impatient",
  "Bored",
  "Overconfident",
] as const;

export type TradeEmotion = (typeof tradeEmotions)[number];
