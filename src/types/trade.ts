import type { TradeTimeframe } from "@/config/trade-timeframes";

// Shape of a trade as returned by /api/trades (JSON — tradeDate is a string,
// not a Date, since that's what actually arrives over the wire).
export interface TradeDTO {
  id: string;
  symbol: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  takeProfit: number | null;
  stopLoss: number | null;
  size: number;
  pnl: number;
  tradeDate: string;
  notes: string | null;
}

// Server-side validated shape for creating/updating a trade (same fields as
// TradeDTO minus `id`, since that's assigned by the database).
export interface TradeInput {
  symbol: string;
  direction: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  takeProfit: number | null;
  stopLoss: number | null;
  size: number;
  pnl: number;
  tradeDate: string;
  notes: string | null;
}

export interface TradeImageDTO {
  id: string;
  timeframe: TradeTimeframe;
  caption: string | null;
  url: string;
}

// Local-only staging for a chart image on the create form, before the trade
// (and therefore the image's parent id) exists.
export interface PendingImageEntry {
  localId: string;
  timeframe: TradeTimeframe;
  file: File;
  caption: string;
  previewUrl: string;
}

export interface DailyStats {
  pnl: number;
  trades: number;
  wins: number;
}

export interface MonthSummary {
  bestDay: { day: number; pnl: number } | null;
  worstDay: { day: number; pnl: number } | null;
  streak: { type: "win" | "loss"; count: number } | null;
}
