// Asset classes a setup applies to. Values render verbatim in the UI (no
// i18n keys) — same rationale as trade-mistake-tags.ts.
export const tradeInstruments = ["Forex", "Crypto", "Futures"] as const;

export type TradeInstrument = (typeof tradeInstruments)[number];
