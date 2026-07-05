// Hand-rolled server-side validation for trade create/update payloads.
import type { TradeInput } from "@/types/trade";

type ValidationResult = { ok: true; data: TradeInput } | { ok: false; error: string };

function parseOptionalNumber(value: unknown): { ok: true; value: number | null } | { ok: false } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { ok: false };
  }
  return { ok: true, value };
}

export function validateTradeInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }

  const { symbol, direction, entryPrice, exitPrice, takeProfit, stopLoss, size, pnl, tradeDate, notes } =
    body as Record<string, unknown>;

  if (typeof symbol !== "string" || symbol.trim().length === 0) {
    return { ok: false, error: "Symbol is required." };
  }
  if (direction !== "long" && direction !== "short") {
    return { ok: false, error: 'Direction must be "long" or "short".' };
  }
  if (typeof entryPrice !== "number" || !Number.isFinite(entryPrice)) {
    return { ok: false, error: "Entry price must be a number." };
  }
  if (typeof exitPrice !== "number" || !Number.isFinite(exitPrice)) {
    return { ok: false, error: "Exit price must be a number." };
  }

  const takeProfitResult = parseOptionalNumber(takeProfit);
  if (!takeProfitResult.ok) {
    return { ok: false, error: "Take profit must be a number." };
  }
  const stopLossResult = parseOptionalNumber(stopLoss);
  if (!stopLossResult.ok) {
    return { ok: false, error: "Stop loss must be a number." };
  }

  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return { ok: false, error: "Size must be a positive number." };
  }
  if (typeof pnl !== "number" || !Number.isFinite(pnl)) {
    return { ok: false, error: "P&L must be a number." };
  }
  if (typeof tradeDate !== "string" || Number.isNaN(Date.parse(tradeDate))) {
    return { ok: false, error: "Trade date is invalid." };
  }
  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return { ok: false, error: "Notes must be text." };
  }

  return {
    ok: true,
    data: {
      symbol: symbol.trim(),
      direction,
      entryPrice,
      exitPrice,
      takeProfit: takeProfitResult.value,
      stopLoss: stopLossResult.value,
      size,
      pnl,
      tradeDate,
      notes: typeof notes === "string" && notes.trim().length > 0 ? notes.trim() : null,
    },
  };
}
