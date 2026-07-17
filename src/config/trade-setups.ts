// The trader's "playbook" — a fixed, ICT-leaning list of named setups. Every
// trade gets at most one. Values render verbatim in the UI (no i18n keys) —
// they're jargon/proper nouns, not sentences to translate.
export const tradeSetups = [
  "FVG (Fair Value Gap)",
  "Order Block",
  "Breaker Block",
  "Liquidity Sweep",
  "Market Structure Shift",
  "Change of Character",
  "Optimal Trade Entry",
  "Silver Bullet",
  "Judas Swing",
  "Turtle Soup",
  "Power of Three",
  "Mitigation Block",
  "SMT Divergence",
  "Unicorn Model",
  "Breakout",
  "Reversal",
  "Other",
] as const;

export type TradeSetup = (typeof tradeSetups)[number];
