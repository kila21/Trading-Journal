import type { TradeTimeframe } from "@/config/trade-timeframes";
import type { TradeMistakeTag } from "@/config/trade-mistake-tags";
import type { TradeEmotion } from "@/config/trade-emotions";
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
  emotions: TradeEmotion[];
  followedPlan: boolean | null;
  checkedConditions: string[];
  // Optional dollar amount manually entered as "at risk" on this trade (see
  // prisma/schema.prisma's Trade.riskAmount for why this isn't auto-derived).
  riskAmount: number | null;
  // Contract-type key into src/config/instrument-specs.ts ("emini" | "micro" |
  // "standard"). Resolves the dollar point value for P&L / risk math.
  contractSize: string | null;
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
  emotions: TradeEmotion[];
  followedPlan: boolean | null;
  checkedConditions: string[];
  riskAmount: number | null;
  contractSize: string | null;
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

// Rollup of a calendar week's DailyStats, shown in the week summary bar next
// to each row. Null when the week (restricted to days in the currently
// displayed month) had no trades at all.
export interface WeekSummary {
  pnl: number;
  trades: number;
  wins: number;
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

// Per-emotion row on the Analytics "performance by emotion" card. A trade with
// several emotions contributes to each of its rows.
export interface EmotionBreakdownRow {
  emotion: TradeEmotion;
  trades: number;
  wins: number;
  winRate: number; // 0..1
  totalPnl: number;
}

// One column of the achieved-R distribution histogram. `min`/`max` are the
// half-open bucket bounds `(min, max]`; a null bound is an open end
// (`min: null` = everything at or below `max`; `max: null` = above `min`).
export interface RBucket {
  key: string;
  min: number | null;
  max: number | null;
  count: number;
  totalPnl: number;
}

// Per-weekday row on the Analytics "performance by day of week" card.
// `weekday` is Monday=0..Sunday=6 (matches the calendar grid).
export interface DayOfWeekRow {
  weekday: number;
  trades: number;
  wins: number;
  winRate: number; // 0..1
  totalPnl: number;
}

// Per-hour row on the Analytics "performance by hour" card. `hour` is the
// trade's local wall-clock entry hour, 0..23.
export interface HourOfDayRow {
  hour: number;
  trades: number;
  wins: number;
  winRate: number; // 0..1
  totalPnl: number;
}

// Avg hold duration (minutes) for winning vs losing trades. Each side is null
// independently when no trade on that side has a recorded exit time.
export interface HoldTimeComparison {
  avgWinnerMinutes: number | null;
  avgLoserMinutes: number | null;
}

// One duration bucket on the Analytics hold-time card. `key` identifies the
// range (`lt15`, `15to60`, `1to4h`, `4to24h`, `gt1d`); the label is derived
// in the component.
export interface HoldBucket {
  key: string;
  trades: number;
  wins: number;
  winRate: number; // 0..1
  totalPnl: number;
}

// Per-symbol row on the Analytics "performance by symbol" card — same shape
// as SetupBreakdownRow, keyed on the trade's symbol.
export interface SymbolBreakdownRow {
  symbol: string;
  trades: number;
  wins: number;
  winRate: number; // 0..1
  totalPnl: number;
  expectancy: number; // avg pnl per trade, this symbol only
}

// Long vs short comparison row on the Analytics "performance by direction"
// card. A side with zero trades is omitted by the breakdown function.
export interface DirectionRow {
  direction: "long" | "short";
  trades: number;
  wins: number;
  winRate: number; // 0..1
  totalPnl: number;
  avgAchievedR: number | null;
}

// Trade-level win/loss streaks — distinct from the calendar-day streak in
// MonthSummary. `current` is null only when there are no trades at all.
export interface ConsecutiveStreaks {
  maxWins: number;
  maxLosses: number;
  current: { type: "win" | "loss"; count: number } | null;
}
