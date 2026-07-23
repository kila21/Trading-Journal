import type { TradeTimeframe } from "@/config/trade-timeframes";
import type { TradeMistakeTag } from "@/config/trade-mistake-tags";
import type { SessionName } from "@/types/trading-session";

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
  contracts: number;
  pnl: number;
  tradeDate: string;
  exitDate: string | null;
  notes: string | null;
  setup: string | null;
  mistakeTags: TradeMistakeTag[];
  followedPlan: boolean | null;
  checkedConditions: string[];
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
  contracts: number;
  pnl: number;
  tradeDate: string;
  exitDate: string | null;
  notes: string | null;
  setup: string | null;
  mistakeTags: TradeMistakeTag[];
  followedPlan: boolean | null;
  checkedConditions: string[];
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
  // ISO timestamp of the earliest trade opened that day — used to resolve
  // which trading session badge to show on the calendar day cell.
  firstTradeDate: string;
}

export interface MonthSummary {
  bestDay: { day: number; pnl: number } | null;
  worstDay: { day: number; pnl: number } | null;
  streak: { type: "win" | "loss"; count: number } | null;
}

// A point on the cumulative-P&L equity curve. `point` 0 is the synthetic
// starting baseline (before any trade); 1..N follow the Nth trade in
// chronological order.
export interface EquityPoint {
  point: number;
  value: number;
}

// Per-setup row on the Analytics page's setup breakdown table.
export interface SetupBreakdownRow {
  setup: string;
  trades: number;
  wins: number;
  winRate: number; // 0..1
  totalPnl: number;
  expectancy: number; // avg pnl per trade, this setup only
}

// Per-session row on the Analytics page's session breakdown card. `session`
// is null for the "no session" bucket — trades outside every Kill Zone.
export interface SessionBreakdownRow {
  session: SessionName | null;
  trades: number;
  wins: number;
  winRate: number; // 0..1
  totalPnl: number;
}

interface PlanBucketStats {
  trades: number;
  totalPnl: number;
  avgAchievedR: number | null;
}

// Followed-plan vs broke-plan comparison for the Analytics "Discipline"
// card. Trades with followedPlan unset (null) are excluded — this card only
// compares the two states the trader actually recorded.
export interface FollowedPlanComparison {
  followed: PlanBucketStats;
  notFollowed: PlanBucketStats;
}

// "Wins vs losses" card data — avgWin/avgLoss/largestWin are each null when
// that side has no trades (no wins yet, or no losses yet).
export interface WinLossBreakdown {
  avgWin: number | null;
  winCount: number;
  avgLoss: number | null;
  lossCount: number;
  largestWin: { pnl: number; symbol: string; tradeDate: string } | null;
  ratio: number | null; // avgWin / |avgLoss|
}

// One row in the "Cost by mistake" breakdown — total P&L across every trade
// tagged with this mistake (a trade with multiple tags contributes to more
// than one row, since each tag is its own attribution, not a mutually
// exclusive bucket).
export interface MistakeCostRow {
  tag: TradeMistakeTag;
  trades: number;
  totalPnl: number;
}
