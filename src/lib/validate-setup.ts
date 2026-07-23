// Hand-rolled server-side validation for setup create/update payloads.
import { tradeInstruments, type TradeInstrument } from "@/config/trade-instruments";
import { tradingSessions } from "@/config/trade-sessions";
import type { SessionName } from "@/types/trading-session";
import type { SetupInput, SetupStatus } from "@/types/setup";

type ValidationResult = { ok: true; data: SetupInput } | { ok: false; error: string };

const sessionNames = tradingSessions.map((session) => session.name) as SessionName[];

function parseOptionalNumber(value: unknown): { ok: true; value: number | null } | { ok: false } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { ok: false };
  }
  return { ok: true, value };
}

function parseOptionalText(value: unknown): { ok: true; value: string | null } | { ok: false } {
  if (value === undefined || value === null) return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false };
  const trimmed = value.trim();
  return { ok: true, value: trimmed.length > 0 ? trimmed : null };
}

export function validateSetupInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }

  const { name, description, status, conditions, stopRule, targetRule, minR, sessions, instruments } =
    body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0) {
    return { ok: false, error: "Name is required." };
  }

  const descriptionResult = parseOptionalText(description);
  if (!descriptionResult.ok) {
    return { ok: false, error: "Description must be text." };
  }

  const resolvedStatus: SetupStatus = status === undefined || status === null ? "active" : (status as SetupStatus);
  if (resolvedStatus !== "active" && resolvedStatus !== "testing" && resolvedStatus !== "retired") {
    return { ok: false, error: 'Status must be "active", "testing", or "retired".' };
  }

  let resolvedConditions: string[] = [];
  if (conditions !== undefined && conditions !== null) {
    if (!Array.isArray(conditions) || !conditions.every((condition) => typeof condition === "string")) {
      return { ok: false, error: "Invalid entry conditions." };
    }
    // Order is preserved (drag-reordering is the point) — no dedup, just
    // trim and drop rows the trader left empty.
    resolvedConditions = conditions.map((condition) => condition.trim()).filter((condition) => condition.length > 0);
  }

  const stopRuleResult = parseOptionalText(stopRule);
  if (!stopRuleResult.ok) {
    return { ok: false, error: "Stop rule must be text." };
  }
  const targetRuleResult = parseOptionalText(targetRule);
  if (!targetRuleResult.ok) {
    return { ok: false, error: "Target rule must be text." };
  }

  const minRResult = parseOptionalNumber(minR);
  if (!minRResult.ok || (minRResult.value !== null && minRResult.value < 0)) {
    return { ok: false, error: "Min R must be a non-negative number." };
  }

  let resolvedSessions: SessionName[] = [];
  if (sessions !== undefined && sessions !== null) {
    if (!Array.isArray(sessions) || !sessions.every((session) => sessionNames.includes(session as SessionName))) {
      return { ok: false, error: "Invalid sessions." };
    }
    resolvedSessions = Array.from(new Set(sessions)) as SessionName[];
  }

  let resolvedInstruments: TradeInstrument[] = [];
  if (instruments !== undefined && instruments !== null) {
    if (
      !Array.isArray(instruments) ||
      !instruments.every((instrument) => tradeInstruments.includes(instrument as TradeInstrument))
    ) {
      return { ok: false, error: "Invalid instruments." };
    }
    resolvedInstruments = Array.from(new Set(instruments)) as TradeInstrument[];
  }

  return {
    ok: true,
    data: {
      name: name.trim(),
      description: descriptionResult.value,
      status: resolvedStatus,
      conditions: resolvedConditions,
      stopRule: stopRuleResult.value,
      targetRule: targetRuleResult.value,
      minR: minRResult.value,
      sessions: resolvedSessions,
      instruments: resolvedInstruments,
    },
  };
}
