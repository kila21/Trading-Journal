"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleChipGroup } from "@/components/ui/toggle-chip-group";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { formatFullDate, toLocale } from "@/components/dashboard/calendar/format-date";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { ChevronRightIcon, ImageIcon } from "@/components/dashboard/icons";
import { tradeSymbols } from "@/config/trade-symbols";
import { tradeMistakeTags, type TradeMistakeTag } from "@/config/trade-mistake-tags";
import { useSetups } from "@/components/dashboard/playbook/use-setups";
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

/**
 * Exit time is only meaningful relative to entry time on the same calendar
 * day (see the exitDate construction in handleSubmit) — a non-blocking
 * warning, same treatment as the TP/SL warnings above.
 */
function hasExitTimeWarning(entryTime: string, exitTime: string): boolean {
  if (entryTime === "" || exitTime === "") return false;
  return exitTime < entryTime;
}

/**
 * Minutes between two "HH:MM" strings on the same calendar day, for the live
 * hold-duration readout while the form is still open (before there's a real
 * TradeDTO to run computeHoldDurationMinutes against). Null when either time
 * is missing or exit precedes entry — the warning above already covers that
 * case, this just avoids showing a nonsensical negative duration.
 */
function computeLiveHoldMinutes(entryTime: string, exitTime: string): number | null {
  if (entryTime === "" || exitTime === "") return null;
  const [entryHours, entryMinutes] = entryTime.split(":").map(Number);
  const [exitHours, exitMinutes] = exitTime.split(":").map(Number);
  const minutes = exitHours * 60 + exitMinutes - (entryHours * 60 + entryMinutes);
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
      pnl: String(Math.abs(trade.pnl)),
      dateInput: toDateInputValue(new Date(trade.tradeDate)),
      time: toTimeInputValue(new Date(trade.tradeDate)),
      exitTime: trade.exitDate ? toTimeInputValue(new Date(trade.exitDate)) : "",
      notes: trade.notes ?? "",
      setup: trade.setup ?? "",
      mistakeTags: trade.mistakeTags,
      followedPlan: trade.followedPlan === true,
      checkedConditions: trade.checkedConditions,
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
    pnl: "",
    dateInput: toDateInputValue(date),
    time: toTimeInputValue(new Date()),
    exitTime: "",
    notes: "",
    setup: "",
    mistakeTags: [] as TradeMistakeTag[],
    followedPlan: false,
    checkedConditions: [] as string[],
  };
}

export function TradeForm({
  date,
  trade,
  onClose,
  onSaved,
}: {
  date: Date;
  trade?: TradeDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard");
  const locale = toLocale(useLocale());
  const { setups } = useSetups();
  const [form, setForm] = useState(() => formStateFor(trade, date));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTrade, setCreatedTrade] = useState<TradeDTO | undefined>(undefined);
  const [pendingImages, setPendingImages] = useState<PendingImageEntry[]>([]);
  const [imagesOpen, setImagesOpen] = useState(false);

  // Once a create succeeds, `createdTrade` takes over from the `trade` prop —
  // this is what prevents a retry (e.g. after a failed image upload) from
  // POSTing a second trade instead of PATCHing the one that now exists.
  const effectiveTrade = trade ?? createdTrade;

  const takeProfitWarning = hasTakeProfitWarning(form.direction, form.entryPrice, form.takeProfit);
  const stopLossWarning = hasStopLossWarning(form.direction, form.entryPrice, form.stopLoss);
  const exitTimeWarning = hasExitTimeWarning(form.time, form.exitTime);

  const pnlSign = computePnlSign(form.direction, form.entryPrice, form.exitPrice);
  const pnlMagnitude = Number(form.pnl);
  const computedPnl =
    form.pnl !== "" && Number.isFinite(pnlMagnitude) ? pnlSign * Math.abs(pnlMagnitude) : null;

  const riskReward = computeRiskReward(form.entryPrice, form.stopLoss, form.takeProfit);
  const liveHoldMinutes = computeLiveHoldMinutes(form.time, form.exitTime);
  const selectedSetup = setups.find((s) => s.name === form.setup) ?? null;
  const belowMinRWarning =
    selectedSetup?.minR != null && riskReward !== null && riskReward.plannedR < selectedSetup.minR;

  const liveSession = (() => {
    if (form.time === "" || form.dateInput === "") return null;
    const [hours, minutes] = form.time.split(":").map(Number);
    const entryDateTime = parseDateInputValue(form.dateInput);
    entryDateTime.setHours(hours || 0, minutes || 0, 0, 0);
    return getTradingSession(entryDateTime);
  })();

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

    const [hours, minutes] = form.time.split(":").map(Number);
    const tradeDate = parseDateInputValue(form.dateInput);
    tradeDate.setHours(hours || 0, minutes || 0, 0, 0);

    // exitTime shares the same calendar day as the entry — cross-day holds
    // aren't representable yet, tracked as a known limitation.
    let exitDate: string | null = null;
    if (form.exitTime !== "") {
      const [exitHours, exitMinutes] = form.exitTime.split(":").map(Number);
      const exit = parseDateInputValue(form.dateInput);
      exit.setHours(exitHours || 0, exitMinutes || 0, 0, 0);
      exitDate = exit.toISOString();
    }

    const payload = {
      symbol: form.symbol,
      direction: form.direction,
      entryPrice: Number(form.entryPrice),
      exitPrice: Number(form.exitPrice),
      takeProfit: form.takeProfit === "" ? null : Number(form.takeProfit),
      stopLoss: form.stopLoss === "" ? null : Number(form.stopLoss),
      contracts: Number(form.contracts),
      pnl: computePnlSign(form.direction, form.entryPrice, form.exitPrice) * Math.abs(Number(form.pnl)),
      tradeDate: tradeDate.toISOString(),
      exitDate,
      notes: form.notes,
      setup: form.setup === "" ? null : form.setup,
      mistakeTags: form.mistakeTags,
      followedPlan: form.followedPlan,
      checkedConditions: form.checkedConditions,
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

    let uploadFailed = false;

    if (isCreating && pendingImages.length > 0) {
      for (const entry of pendingImages) {
        const formData = new FormData();
        formData.append("file", entry.file);
        formData.append("timeframe", entry.timeframe);
        formData.append("caption", entry.caption);

        const uploadResponse = await fetch(`/api/trades/${savedTrade.id}/images`, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) uploadFailed = true;
      }
      setPendingImages([]);
    }

    setPending(false);
    onSaved();

    if (uploadFailed) {
      setError(t("imageUploadFailed"));
      setImagesOpen(true);
      return;
    }

    onClose();
  }

  async function handleDelete() {
    if (!effectiveTrade) return;
    if (!window.confirm(t("confirmDeleteTrade"))) return;

    setPending(true);
    const response = await fetch(`/api/trades/${effectiveTrade.id}`, { method: "DELETE" });
    setPending(false);

    if (!response.ok) {
      setError(t("errorGeneric"));
      return;
    }

    onSaved();
    onClose();
  }

  return (
    <>
      <h2 className="text-lg font-semibold">{effectiveTrade ? t("editTrade") : t("newTrade")}</h2>
      <p className="mt-1 text-sm text-muted">
        {formatFullDate(form.dateInput === "" ? date : parseDateInputValue(form.dateInput), locale)}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-left">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="symbol">{t("symbolLabel")}</Label>
            <Input
              id="symbol"
              name="symbol"
              list="trade-symbols"
              autoComplete="off"
              required
              value={form.symbol}
              onChange={handleChange}
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
          <div className="grid grid-cols-3 gap-4">
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
          </div>

          {riskReward && (
            <div className="rounded-lg bg-primary/15 px-4 py-2.5 text-sm font-medium text-primary">
              <div className="flex items-center justify-between">
                <span>
                  {t("riskRewardLabel")} {formatRiskRewardRatio(riskReward.risk, riskReward.reward)}
                </span>
                <span>
                  {t("plannedInlineLabel")} {formatRMultiple(riskReward.plannedR)}
                </span>
              </div>
              {belowMinRWarning && (
                <p className="mt-1 text-xs font-medium text-warning">
                  {t("belowMinRWarning", {
                    planned: formatRMultiple(riskReward.plannedR),
                    min: formatRMultiple(selectedSetup!.minR!),
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted">{t("resultSectionLabel")}</p>
          <div className="grid grid-cols-3 gap-4">
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
            <div className="space-y-1.5">
              <Label htmlFor="pnl" className="flex items-center gap-1.5">
                {t("pnlLabel")}
                <InfoTooltip text={t("pnlHint")} />
              </Label>
              <Input
                id="pnl"
                name="pnl"
                type="number"
                step="any"
                min="0"
                required
                value={form.pnl}
                onChange={handleChange}
                style={{ color: computedPnl === null ? undefined : computedPnl > 0 ? "var(--success)" : computedPnl < 0 ? "var(--danger)" : undefined }}
                className="font-semibold"
              />
              {computedPnl !== null && (
                <p
                  className={cn(
                    "text-xs font-medium",
                    computedPnl > 0 ? "text-success" : computedPnl < 0 ? "text-danger" : "text-muted",
                  )}
                >
                  {t("calculatedPnl")}: {formatPnl(computedPnl)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-4">
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
            <div className="space-y-1.5">
              <Label htmlFor="exitTime">{t("exitTimeLabel")}</Label>
              <Input id="exitTime" name="exitTime" type="time" value={form.exitTime} onChange={handleChange} />
              {exitTimeWarning && <p className="text-xs text-warning">{t("exitTimeWarning")}</p>}
            </div>
          </div>
          {form.time !== "" && (
            <div className="flex items-center justify-between">
              {liveSession ? (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {t(sessionTranslationKeys[liveSession.name])}
                </span>
              ) : (
                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
                  {t("noActiveSession")}
                </span>
              )}
              {liveHoldMinutes !== null && (
                <span className="text-xs font-medium text-muted">
                  {t("holdDurationLabel")}: {formatDuration(liveHoldMinutes)}
                </span>
              )}
            </div>
          )}
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
          <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} />
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
              {effectiveTrade ? (
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

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center justify-between gap-3 pt-2">
          {effectiveTrade ? (
            <Button type="button" variant="outline" disabled={pending} onClick={handleDelete}>
              {t("deleteTrade")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" disabled={pending} onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {effectiveTrade ? t("saveTradeSubmit") : t("addTradeSubmit")}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
