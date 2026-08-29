// Client-side CSV export for the trades list. Pure and translation-free
// (unlike the rest of dashboard/trades) since a data export should stay
// stable regardless of UI locale — columns use raw underlying values
// (session name, setup name) rather than translated display labels.
import { computeAchievedR } from "./trade-stats";
import { getTradingSession } from "./trading-session";
import type { TradeDTO } from "@/types/trade";

const CSV_HEADERS = [
  "Date",
  "Exit Date",
  "Symbol",
  "Direction",
  "Entry Price",
  "Exit Price",
  "Stop Loss",
  "Take Profit",
  "Contracts",
  "Contract Type",
  "PnL",
  "Risk Amount",
  "Achieved R",
  "Setup",
  "Session",
  "Emotions",
  "Mistake Tags",
  "Followed Plan",
  "Notes",
];

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function tradesToCsv(trades: TradeDTO[]): string {
  const rows = trades.map((trade) => {
    const achievedR = computeAchievedR(trade);
    const session = getTradingSession(new Date(trade.tradeDate));

    return [
      trade.tradeDate,
      trade.exitDate ?? "",
      trade.symbol,
      trade.direction,
      trade.entryPrice,
      trade.exitPrice,
      trade.stopLoss ?? "",
      trade.takeProfit ?? "",
      trade.contracts,
      trade.contractSize ?? "",
      trade.pnl,
      trade.riskAmount ?? "",
      achievedR === null ? "" : achievedR.toFixed(2),
      trade.setup ?? "",
      session?.name ?? "",
      (trade.emotions ?? []).join("; "),
      (trade.mistakeTags ?? []).join("; "),
      trade.followedPlan === null ? "" : trade.followedPlan ? "Yes" : "No",
      trade.notes ?? "",
    ]
      .map(csvCell)
      .join(",");
  });

  return [CSV_HEADERS.join(","), ...rows].join("\r\n");
}
