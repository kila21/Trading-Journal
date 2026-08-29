// Per-instrument contract specs: the dollar value of a 1.0 price move, per
// contract, for each contract *type* the trader might use (E-mini vs Micro,
// standard vs mini lot, …). Feeds the P&L auto-calc and dollar risk derived
// from price distances.
//
// Point value is a fixed exchange/broker contract spec — it does NOT change
// with account size. Index-futures micros are exactly 1/10 the E-mini.

export interface ContractTypeSpec {
  /** Stable key stored on the trade (Trade.contractSize) and shown in the select. */
  key: string;
  /** Display label (already user-facing; short enough not to need i18n). */
  label: string;
  /** Dollars of P&L per 1.0 price move, per 1 contract. */
  pointValue: number;
}

export interface InstrumentSpec {
  types: ContractTypeSpec[];
  /** Which type `key` a new trade on this symbol defaults to. */
  defaultType: string;
}

function indexFutures(emini: number, micro: number): InstrumentSpec {
  return {
    types: [
      { key: "emini", label: "E-mini", pointValue: emini },
      { key: "micro", label: "Micro", pointValue: micro },
    ],
    defaultType: "emini",
  };
}

// Spot / CFD style: one unit moves $1 of P&L per $1 of price. Covers crypto,
// metals-as-CFD and cash equities as the user trades them today.
const SPOT: InstrumentSpec = {
  types: [{ key: "standard", label: "Standard", pointValue: 1 }],
  defaultType: "standard",
};

export const instrumentSpecs: Record<string, InstrumentSpec> = {
  ES: indexFutures(50, 5),
  NQ: indexFutures(20, 2),
  YM: indexFutures(5, 0.5),
  RTY: indexFutures(50, 5),
  DAX: SPOT,
  BTC: SPOT,
  ETH: SPOT,
  SOL: SPOT,
  XRP: SPOT,
  BNB: SPOT,
  XAUUSD: SPOT,
  XAGUSD: SPOT,
  AAPL: SPOT,
  MSFT: SPOT,
  GOOGL: SPOT,
  AMZN: SPOT,
  TSLA: SPOT,
};

/** The contract-type options for a symbol, or null if the symbol has no spec. */
export function contractTypesFor(symbol: string): ContractTypeSpec[] | null {
  return instrumentSpecs[symbol]?.types ?? null;
}

/** The default contract-type key for a symbol, or null if the symbol has no spec. */
export function defaultContractType(symbol: string): string | null {
  return instrumentSpecs[symbol]?.defaultType ?? null;
}

/**
 * Resolve the dollar point value for a trade from its symbol + contract type
 * (falling back to the symbol's default type). Null when the symbol has no
 * spec — dollar-based figures then render "—" and P&L stays manual.
 */
export function resolvePointValue(symbol: string, contractType: string | null): number | null {
  const spec = instrumentSpecs[symbol];
  if (!spec) return null;
  const type = spec.types.find((option) => option.key === (contractType ?? spec.defaultType));
  return type ? type.pointValue : null;
}
