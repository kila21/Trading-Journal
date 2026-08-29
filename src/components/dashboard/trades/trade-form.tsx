"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleChipGroup } from "@/components/ui/toggle-chip-group";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { ChevronRightIcon, ImageIcon } from "@/components/dashboard/icons";
import { tradeSymbols } from "@/config/trade-symbols";
import { tradeMistakeTags, type TradeMistakeTag } from "@/config/trade-mistake-tags";
import { tradeEmotions, type TradeEmotion } from "@/config/trade-emotions";
import {
  contractTypesFor,
  defaultContractType,
  resolvePointValue,
} from "@/config/instrument-specs";
import { useSetups } from "@/components/dashboard/playbook/use-setups";
import { useTradingSettings } from "@/components/dashboard/settings/use-trading-settings";
import { formatRMultiple, formatDuration } from "./trade-stats";
import { getTradingSession, sessionTranslationKeys } from "./trading-session";
import { cn } from "@/lib/utils";
import { TradeImageManager } from "./trade-image-manager";
import { PendingImageManager } from "./pending-image-manager";
import type { TradeDTO, PendingImageEntry } from "@/types/trade";

function toTimeInputValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses a "YYYY-MM-DD" `<input type="date">` value as a local-midnight Date — never through the UTC-parsing `new Date(string)` constructor, which would shift the day in timezones behind UTC. */
function parseDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * The P&L input only ever takes a magnitude — the sign is derived here, not
 * typed. Long: profit when exit > entry. Short: profit when entry > exit.
 * Returns 0 when prices are missing/equal, since there's no price movement to
 * derive a sign from.
 */
function computePnlSign(direction: "long" | "short", entryPrice: string, exitPrice: string): 1 | -1 | 0 {
  const entry = Number(entryPrice);
  const exit = Number(exitPrice);

  if (entryPrice === "" || exitPrice === "" || !Number.isFinite(entry) || !Number.isFinite(exit)) {
    return 0;
  }
  if (entry === exit) return 0;

  const priceMovedUp = exit > entry;
  const isProfit = direction === "long" ? priceMovedUp : !priceMovedUp;
  return isProfit ? 1 : -1;
}

/**
 * Take profit should sit beyond entry in the direction of profit: above entry
 * for a long, below entry for a short. Non-blocking — flagged as a warning,
 * not enforced, since it's still just a plan the trader can override.
 */
function hasTakeProfitWarning(direction: "long" | "short", entryPrice: string, takeProfit: string): boolean {
  if (entryPrice === "" || takeProfit === "") return false;

  const entry = Number(entryPrice);
  const tp = Number(takeProfit);
  if (!Number.isFinite(entry) || !Number.isFinite(tp)) return false;

  return direction === "long" ? tp <= entry : tp >= entry;
}

/**
 * Stop loss should sit on the protective side of entry: at or below entry for
 * a long, at or above entry for a short. Warning only, not enforced — a
 * trailing stop moved into profit can legitimately end up past entry.
 */
function hasStopLossWarning(direction: "long" | "short", entryPrice: string, stopLoss: string): boolean {
  if (entryPrice === "" || stopLoss === "") return false;

  const entry = Number(entryPrice);
  const sl = Number(stopLoss);
  if (!Number.isFinite(entry) || !Number.isFinite(sl)) return false;

  return direction === "long" ? sl > entry : sl < entry;
}

/** Combines a "YYYY-MM-DD" date-input value and an "HH:MM" time into a local Date. */
function combineDateTime(dateInput: string, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const date = parseDateInputValue(dateInput);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

/**
 * Warn when the exit timestamp lands before the entry one. Exit can be its own
 * calendar day now (swing holds); when only an exit time is given it falls
 * back to the entry day. Non-blocking — same treatment as the TP/SL warnings.
 */
function hasExitBeforeEntryWarning(
  entryDateInput: string,
  entryTime: string,
  exitDateInput: string,
  exitTime: string,
): boolean {
  if (entryDateInput === "" || entryTime === "") return false;
  if (exitDateInput === "" && exitTime === "") return false;
  const entry = combineDateTime(entryDateInput, entryTime);
  const exit = combineDateTime(exitDateInput || entryDateInput, exitTime || "00:00");
  return exit.getTime() < entry.getTime();
}

/**
 * Minutes between entry and exit for the live hold-duration readout while the
 * form is still open (before there's a real TradeDTO for
 * computeHoldDurationMinutes). Null when a needed field is missing or exit
 * precedes entry — the warning above covers that case, this just avoids a
 * nonsensical negative duration.
 */
function computeLiveHoldMinutes(
  entryDateInput: string,
  entryTime: string,
  exitDateInput: string,
  exitTime: string,
): number | null {
  if (entryDateInput === "" || entryTime === "" || exitTime === "") return null;
  const entry = combineDateTime(entryDateInput, entryTime);
  const exit = combineDateTime(exitDateInput || entryDateInput, exitTime);
  const minutes = Math.round((exit.getTime() - entry.getTime()) / 60000);
  return minutes >= 0 ? minutes : null;
}

/** Trims trailing zeros (e.g. 10 not 10.00, 2.5 not 2.50). */
function formatPlanValue(value: number): string {
  return Number(value.toFixed(2)).toString();
}

/**
 * Normalized risk:reward ratio (risk side pinned to 1) — "1:2", "1:3.5" —
 * rather than the raw price-distance numbers, which can be arbitrarily large
 * (e.g. "10:300") and don't read as a ratio at a glance.
 */
function formatRiskRewardRatio(risk: number, reward: number): string {
  return `1:${formatPlanValue(reward / risk)}`;
}

/**
 * Risk (entry-to-stop distance), reward (entry-to-target distance), and the
 * resulting planned R, computed live from the plan fields — null unless
 * entry/stop/target are all valid numbers with a non-zero stop distance.
 */
function computeRiskReward(
  entryPrice: string,
  stopLoss: string,
  takeProfit: string,
): { risk: number; reward: number; plannedR: number } | null {
  if (entryPrice === "" || stopLoss === "" || takeProfit === "") return null;
  const entry = Number(entryPrice);
  const sl = Number(stopLoss);
  const tp = Number(takeProfit);
  if (!Number.isFinite(entry) || !Number.isFinite(sl) || !Number.isFinite(tp)) return null;

  const risk = Math.abs(entry - sl);
  if (risk === 0) return null;
  const reward = Math.abs(tp - entry);
  return { risk, reward, plannedR: reward / risk };
}

function numberOrNull(value: string): number | null {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formStateFor(trade: TradeDTO | undefined, date: Date) {
  if (trade) {
    return {
      symbol: trade.symbol,
      direction: trade.direction,
      entryPrice: String(trade.entryPrice),
      exitPrice: String(trade.exitPrice),
      takeProfit: trade.takeProfit === null ? "" : String(trade.takeProfit),
      stopLoss: trade.stopLoss === null ? "" : String(trade.stopLoss),
      contracts: String(trade.contracts),
      contractSize: trade.contractSize ?? defaultContractType(trade.symbol) ?? "",
      pnl: String(Math.abs(trade.pnl)),
      dateInput: toDateInputValue(new Date(trade.tradeDate)),
      time: toTimeInputValue(new Date(trade.tradeDate)),
      exitDateInput: trade.exitDate ? toDateInputValue(new Date(trade.exitDate)) : "",
      exitTime: trade.exitDate ? toTimeInputValue(new Date(trade.exitDate)) : "",
      notes: trade.notes ?? "",
      setup: trade.setup ?? "",
      mistakeTags: trade.mistakeTags ?? [],
      emotions: trade.emotions ?? [],
      followedPlan: trade.followedPlan === true,
      checkedConditions: trade.checkedConditions ?? [],
      riskAmount: trade.riskAmount === null ? "" : String(trade.riskAmount),
    };
  }

  return {
    symbol: "",
    direction: "long" as "long" | "short",
    entryPrice: "",
    exitPrice: "",
    takeProfit: "",
    stopLoss: "",
    contracts: "",
    contractSize: "",
    pnl: "",
    dateInput: toDateInputValue(date),
    time: toTimeInputValue(new Date()),
    exitDateInput: "",
    exitTime: "",
    notes: "",
    setup: "",
    mistakeTags: [] as TradeMistakeTag[],
    emotions: [] as TradeEmotion[],
    followedPlan: false,
    checkedConditions: [] as string[],
    riskAmount: "",
  };
}

function PanelRow({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span
        className={cn(
          "font-semibold",
          tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function TradeForm({
  date = new Date(),
  trade,
  onSaved,
  onCancel,
  onDeleted,
}: {
  date?: Date;
  trade?: TradeDTO;
  onSaved: (trade: TradeDTO) => void;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("dashboard");
  const { setups } = useSetups();
  const { settings: tradingSettings } = useTradingSettings();
  const accountBalance = tradingSettings?.accountBalance ?? null;
  const [form, setForm] = useState(() => formStateFor(trade, date));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTrade, setCreatedTrade] = useState<TradeDTO | undefined>(undefined);
  const [pendingImages, setPendingImages] = useState<PendingImageEntry[]>([]);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Once a create succeeds, `createdTrade` takes over from the `trade` prop —
  // this is what prevents a retry (e.g. after a failed image upload) from
  // POSTing a second trade instead of PATCHing the one that now exists.
  const effectiveTrade = trade ?? createdTrade;

  const takeProfitWarning = hasTakeProfitWarning(form.direction, form.entryPrice, form.takeProfit);
  const stopLossWarning = hasStopLossWarning(form.direction, form.entryPrice, form.stopLoss);
  const exitBeforeEntryWarning = hasExitBeforeEntryWarning(
    form.dateInput,
    form.time,
    form.exitDateInput,
    form.exitTime,
  );

  const contractTypes = contractTypesFor(form.symbol);
  const resolvedPointValue = resolvePointValue(form.symbol, form.contractSize || null);

  const entryNum = numberOrNull(form.entryPrice);
  const exitNum = numberOrNull(form.exitPrice);
  const stopNum = numberOrNull(form.stopLoss);
  const contractsNum = numberOrNull(form.contracts);

  const pnlSign = computePnlSign(form.direction, form.entryPrice, form.exitPrice);

  // Magnitude of the P&L derived from prices × contracts × $/point. Non-null
  // only when all of those resolve — that's also when the P&L field goes
  // read-only, so the trader never types a number the app can compute.
  const derivedPnlMagnitude =
    entryNum !== null && exitNum !== null && contractsNum !== null && resolvedPointValue !== null
      ? round2(Math.abs(exitNum - entryNum) * resolvedPointValue * contractsNum)
      : null;
  const isPnlDerived = derivedPnlMagnitude !== null;

  const displayedPnl = isPnlDerived ? String(derivedPnlMagnitude) : form.pnl;
  const manualPnlNum = numberOrNull(form.pnl);
  const computedPnl = isPnlDerived
    ? pnlSign * derivedPnlMagnitude!
    : manualPnlNum !== null
      ? pnlSign * Math.abs(manualPnlNum)
      : null;

  const liveDollarRisk =
    entryNum !== null && stopNum !== null && contractsNum !== null && resolvedPointValue !== null
      ? (() => {
          const distance = Math.abs(entryNum - stopNum);
          return distance === 0 ? null : distance * resolvedPointValue * contractsNum;
        })()
      : null;

  const riskAmountValue = numberOrNull(form.riskAmount);
  const riskForPercent = riskAmountValue ?? liveDollarRisk;
  const liveRiskPercent =
    accountBalance !== null && accountBalance > 0 && riskForPercent !== null
      ? (riskForPercent / accountBalance) * 100
      : null;

  const riskReward = computeRiskReward(form.entryPrice, form.stopLoss, form.takeProfit);
  const liveHoldMinutes = computeLiveHoldMinutes(form.dateInput, form.time, form.exitDateInput, form.exitTime);
  const selectedSetup = setups.find((s) => s.name === form.setup) ?? null;
  const belowMinRWarning =
    selectedSetup?.minR != null && riskReward !== null && riskReward.plannedR < selectedSetup.minR;

  const liveSession = (() => {
    if (form.time === "" || form.dateInput === "") return null;
    return getTradingSession(combineDateTime(form.dateInput, form.time));
  })();

  const panelHasContent =
    riskReward !== null ||
    computedPnl !== null ||
    liveDollarRisk !== null ||
    liveRiskPercent !== null ||
    liveSession !== null ||
    liveHoldMinutes !== null;

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSymbolChange(event: ChangeEvent<HTMLInputElement>) {
    const symbol = event.target.value;
    setForm((prev) => ({ ...prev, symbol, contractSize: defaultContractType(symbol) ?? "" }));
  }

  // Checked conditions are specific to whichever setup they were checked
  // against — carrying them over to a newly-picked setup would misrepresent
  // what was actually observed, so a setup change always clears them.
  function handleSetupChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, setup: value, checkedConditions: [] }));
  }

  function toggleCondition(condition: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      checkedConditions: checked
        ? [...prev.checkedConditions, condition]
        : prev.checkedConditions.filter((value) => value !== condition),
    }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const tradeDate = combineDateTime(form.dateInput, form.time);

    // Exit can be its own calendar day (swing/overnight holds). When only a
    // time is given, the exit date falls back to the entry day.
    let exitDate: string | null = null;
    if (form.exitTime !== "" || form.exitDateInput !== "") {
      exitDate = combineDateTime(
        form.exitDateInput || form.dateInput,
        form.exitTime || "00:00",
      ).toISOString();
    }

    const pnlMagnitude = isPnlDerived ? derivedPnlMagnitude! : Math.abs(Number(form.pnl) || 0);

    const payload = {
      symbol: form.symbol,
      direction: form.direction,
      entryPrice: Number(form.entryPrice),
      exitPrice: Number(form.exitPrice),
      takeProfit: form.takeProfit === "" ? null : Number(form.takeProfit),
      stopLoss: form.stopLoss === "" ? null : Number(form.stopLoss),
      contracts: Number(form.contracts),
      pnl: computePnlSign(form.direction, form.entryPrice, form.exitPrice) * pnlMagnitude,
      tradeDate: tradeDate.toISOString(),
      exitDate,
      notes: form.notes,
      setup: form.setup === "" ? null : form.setup,
      mistakeTags: form.mistakeTags,
      emotions: form.emotions,
      followedPlan: form.followedPlan,
      checkedConditions: form.checkedConditions,
      riskAmount: form.riskAmount === "" ? null : Number(form.riskAmount),
      contractSize: form.contractSize === "" ? null : form.contractSize,
    };

    const isCreating = !effectiveTrade;

    const response = effectiveTrade
      ? await fetch(`/api/trades/${effectiveTrade.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!response.ok) {
      setPending(false);
      const body = await response.json().catch(() => null);
      setError(body?.error ?? t("errorGeneric"));
      return;
    }

    const body = await response.json();
    const savedTrade: TradeDTO = body.trade;

    if (isCreating) {
      setCreatedTrade(savedTrade);
    }

    let failedUploadCount = 0;
    let totalUploadCount = 0;

    // Not gated on `isCreating`: after a partial upload failure the trade now
    // exists (createdTrade is set), so a second Save comes through here as an
    // edit — it still needs to retry the leftover images against savedTrade.id.
    if (pendingImages.length > 0 && savedTrade) {
      totalUploadCount = pendingImages.length;
      const results = await Promise.allSettled(
        pendingImages.map(async (entry) => {
          const formData = new FormData();
          formData.append("file", entry.file);
          formData.append("timeframe", entry.timeframe);
          formData.append("caption", entry.caption);

          const uploadResponse = await fetch(`/api/trades/${savedTrade.id}/images`, {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) throw new Error("upload failed");
        }),
      );
      failedUploadCount = results.filter((result) => result.status === "rejected").length;
      // Keep only the entries that failed, so the retry re-uploads just those
      // and doesn't duplicate the ones that already went through.
      setPendingImages(pendingImages.filter((_, index) => results[index].status === "rejected"));
    }

    setPending(false);

    if (failedUploadCount > 0) {
      setError(t("imageUploadFailedCount", { count: failedUploadCount, total: totalUploadCount }));
      setImagesOpen(true);
      return;
    }

    onSaved(savedTrade);
  }

  async function confirmDelete() {
    if (!effectiveTrade) return;

    setConfirmingDelete(false);
    setPending(true);
    const response = await fetch(`/api/trades/${effectiveTrade.id}`, { method: "DELETE" });
    setPending(false);

    if (!response.ok) {
      setError(t("errorGeneric"));
      return;
    }

    onDeleted();
  }

  const contractSizeValue = form.contractSize || (defaultContractType(form.symbol) ?? "");

  return (
    <>
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6 text-left">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="symbol">{t("symbolLabel")}</Label>
              <Input
                id="symbol"
                name="symbol"
                list="trade-symbols"
                autoComplete="off"
                required
                value={form.symbol}
                onChange={handleSymbolChange}
              />
              <datalist id="trade-symbols">
                {tradeSymbols.map((symbol) => (
                  <option key={symbol} value={symbol} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="direction">{t("directionLabel")}</Label>
              <Select id="direction" name="direction" value={form.direction} onChange={handleChange}>
                <option value="long">{t("directionLong")}</option>
                <option value="short">{t("directionShort")}</option>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted">{t("planSectionLabel")}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="entryPrice">{t("entryPriceLabel")}</Label>
                <Input
                  id="entryPrice"
                  name="entryPrice"
                  type="number"
                  step="any"
                  required
                  value={form.entryPrice}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stopLoss">{t("stopLossLabel")}</Label>
                <Input
                  id="stopLoss"
                  name="stopLoss"
                  type="number"
                  step="any"
                  value={form.stopLoss}
                  onChange={handleChange}
                />
                {stopLossWarning && <p className="text-xs text-warning">{t("stopLossWarning")}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="takeProfit">{t("takeProfitLabel")}</Label>
                <Input
                  id="takeProfit"
                  name="takeProfit"
                  type="number"
                  step="any"
                  value={form.takeProfit}
                  onChange={handleChange}
                />
                {takeProfitWarning && <p className="text-xs text-warning">{t("takeProfitWarning")}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="riskAmount">{t("riskAmountLabel")}</Label>
                <Input
                  id="riskAmount"
                  name="riskAmount"
                  type="number"
                  step="any"
                  min="0"
                  value={form.riskAmount}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted">{t("riskAmountHint")}</p>
              </div>
            </div>

            {belowMinRWarning && (
              <p className="text-xs font-medium text-warning">
                {t("belowMinRWarning", {
                  planned: formatRMultiple(riskReward!.plannedR),
                  min: formatRMultiple(selectedSetup!.minR!),
                })}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted">{t("resultSectionLabel")}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="exitPrice">{t("exitPriceLabel")}</Label>
                <Input
                  id="exitPrice"
                  name="exitPrice"
                  type="number"
                  step="any"
                  value={form.exitPrice}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contracts" className="flex items-center gap-1.5">
                  {t("contractsLabel")}
                  <InfoTooltip text={t("contractsHint")} />
                </Label>
                <Input
                  id="contracts"
                  name="contracts"
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={form.contracts}
                  onChange={handleChange}
                />
              </div>
              {contractTypes && (
                <div className="space-y-1.5">
                  <Label htmlFor="contractSize" className="flex items-center gap-1.5">
                    {t("contractSizeLabel")}
                    <InfoTooltip text={t("contractTypeHint")} />
                  </Label>
                  <Select
                    id="contractSize"
                    name="contractSize"
                    value={contractSizeValue}
                    onChange={handleChange}
                    disabled={contractTypes.length < 2}
                  >
                    {contractTypes.map((type) => (
                      <option key={type.key} value={type.key}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1.5 sm:max-w-[13rem]">
              <Label htmlFor="pnl" className="flex items-center gap-1.5">
                {t("pnlLabel")}
                {!isPnlDerived && <InfoTooltip text={t("pnlHint")} />}
              </Label>
              <Input
                id="pnl"
                name="pnl"
                type="number"
                step="any"
                min="0"
                required={!isPnlDerived}
                readOnly={isPnlDerived}
                value={displayedPnl}
                onChange={handleChange}
                className={cn("font-semibold", isPnlDerived && "bg-background/40")}
                style={{
                  color:
                    computedPnl === null
                      ? undefined
                      : computedPnl > 0
                        ? "var(--success)"
                        : computedPnl < 0
                          ? "var(--danger)"
                          : undefined,
                }}
              />
              <p className="text-xs text-muted">{isPnlDerived ? t("pnlDerivedHint") : t("pnlManualHint")}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dateInput">{t("tradeDateLabel")}</Label>
                <Input
                  id="dateInput"
                  name="dateInput"
                  type="date"
                  required
                  value={form.dateInput}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time">{t("entryTimeLabel")}</Label>
                <Input id="time" name="time" type="time" required value={form.time} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="exitDateInput">{t("exitDateLabel")}</Label>
                <Input
                  id="exitDateInput"
                  name="exitDateInput"
                  type="date"
                  min={form.dateInput || undefined}
                  value={form.exitDateInput}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="exitTime">{t("exitTimeLabel")}</Label>
                <Input id="exitTime" name="exitTime" type="time" value={form.exitTime} onChange={handleChange} />
              </div>
            </div>
            {exitBeforeEntryWarning && <p className="text-xs text-warning">{t("exitTimeWarning")}</p>}
          </div>

          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="setup">{t("setupLabel")}</Label>
                <Select id="setup" name="setup" value={form.setup} onChange={handleSetupChange}>
                  <option value="">{t("setupNone")}</option>
                  {setups.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <ToggleSwitch
                checked={form.followedPlan}
                onChange={(checked) => setForm((prev) => ({ ...prev, followedPlan: checked }))}
                label={t("followedPlan")}
              />
            </div>

            {selectedSetup && selectedSetup.conditions.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>{t("conditionsYouSawLabel")}</Label>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
                    {t("conditionsCounter", {
                      checked: form.checkedConditions.length,
                      total: selectedSetup.conditions.length,
                    })}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {selectedSetup.conditions.map((condition) => (
                    <label key={condition} className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={form.checkedConditions.includes(condition)}
                        onChange={(event) => toggleCondition(condition, event.target.checked)}
                        className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
                      />
                      {condition}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>{t("emotionsLabel")}</Label>
              <ToggleChipGroup
                options={tradeEmotions}
                selected={form.emotions}
                onChange={(next) => setForm((prev) => ({ ...prev, emotions: next }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("mistakeTagsLabel")}</Label>
              <ToggleChipGroup
                options={tradeMistakeTags}
                selected={form.mistakeTags}
                onChange={(next) => setForm((prev) => ({ ...prev, mistakeTags: next }))}
                tone="danger"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("notesLabel")}</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={4}
              placeholder={t("notesPlaceholder")}
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setImagesOpen((prev) => !prev)}
              aria-expanded={imagesOpen}
              aria-label={imagesOpen ? t("collapseChartTimeframes") : t("expandChartTimeframes")}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-background/60",
                imagesOpen && "rounded-b-none border-b-transparent",
              )}
            >
              <span className="flex items-center gap-2">
                <ImageIcon className="size-4 text-muted" />
                {t("chartTimeframes")}
              </span>
              <ChevronRightIcon className={cn("size-4 text-muted transition-transform", imagesOpen && "rotate-90")} />
            </button>
            {imagesOpen && (
              <div className="rounded-b-lg border border-t-0 border-border bg-background/20 p-4">
                {effectiveTrade && pendingImages.length === 0 ? (
                  <TradeImageManager tradeId={effectiveTrade.id} />
                ) : (
                  <PendingImageManager
                    entries={pendingImages}
                    onAdd={(entry) => setPendingImages((prev) => [...prev, entry])}
                    onRemove={(localId) =>
                      setPendingImages((prev) => prev.filter((entry) => entry.localId !== localId))
                    }
                    onUpdate={(localId, updates) =>
                      setPendingImages((prev) =>
                        prev.map((entry) => (entry.localId === localId ? { ...entry, ...updates } : entry)),
                      )
                    }
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-foreground">{t("liveSummaryTitle")}</p>
            {panelHasContent ? (
              <div className="mt-3 space-y-2">
                {riskReward && (
                  <>
                    <PanelRow
                      label={t("riskRewardLabel")}
                      value={formatRiskRewardRatio(riskReward.risk, riskReward.reward)}
                    />
                    <PanelRow label={t("plannedRLabel")} value={formatRMultiple(riskReward.plannedR)} />
                  </>
                )}
                {computedPnl !== null && (
                  <PanelRow
                    label={t("calculatedPnl")}
                    value={formatPnl(computedPnl)}
                    tone={computedPnl > 0 ? "success" : computedPnl < 0 ? "danger" : undefined}
                  />
                )}
                {liveDollarRisk !== null && (
                  <PanelRow label={t("dollarRiskLabel")} value={formatPnl(-liveDollarRisk)} tone="danger" />
                )}
                {liveRiskPercent !== null && (
                  <PanelRow
                    label={t("riskPercentLabel")}
                    value={t("riskPercentOfAccount", { percent: liveRiskPercent.toFixed(1) })}
                  />
                )}
                {resolvedPointValue !== null && (
                  <PanelRow label={t("pointValueLabel")} value={`$${formatPlanValue(resolvedPointValue)}`} />
                )}
                {liveSession !== null && (
                  <PanelRow label={t("sessionLabel")} value={t(sessionTranslationKeys[liveSession.name])} />
                )}
                {liveHoldMinutes !== null && (
                  <PanelRow label={t("holdDurationLabel")} value={formatDuration(liveHoldMinutes)} />
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted">{t("liveSummaryEmpty")}</p>
            )}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={pending}>
              {effectiveTrade ? t("saveTradeSubmit") : t("addTradeSubmit")}
            </Button>
            <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>
              {t("cancel")}
            </Button>
            {effectiveTrade && (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setConfirmingDelete(true)}
              >
                {t("deleteTrade")}
              </Button>
            )}
          </div>
        </aside>
      </form>

      {confirmingDelete && (
        <ConfirmDialog
          message={t("confirmDeleteTrade")}
          confirmLabel={t("deleteTrade")}
          cancelLabel={t("cancel")}
          pending={pending}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
