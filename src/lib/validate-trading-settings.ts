// Hand-rolled server-side validation for the trading-settings update payload.
import type { TradingSettingsDTO } from "@/types/trading-settings";

type ValidationResult = { ok: true; data: TradingSettingsDTO } | { ok: false; error: string };

export function validateTradingSettingsInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }

  const { accountBalance } = body as Record<string, unknown>;

  if (accountBalance === undefined || accountBalance === null || accountBalance === "") {
    return { ok: true, data: { accountBalance: null } };
  }
  if (typeof accountBalance !== "number" || !Number.isFinite(accountBalance) || accountBalance < 0) {
    return { ok: false, error: "Account balance must be a non-negative number." };
  }

  return { ok: true, data: { accountBalance } };
}
