"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatFullDate, toLocale } from "@/components/dashboard/calendar/format-date";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { ChevronRightIcon, ImageIcon } from "@/components/dashboard/icons";
import { tradeSymbols } from "@/config/trade-symbols";
import { cn } from "@/lib/utils";
import { TradeImageManager } from "./trade-image-manager";
import { PendingImageManager, type PendingImageEntry } from "./pending-image-manager";
import type { TradeDTO } from "./use-month-trades";

function toTimeInputValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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

function formStateFor(trade: TradeDTO | undefined) {
  if (trade) {
    return {
      symbol: trade.symbol,
      direction: trade.direction,
      entryPrice: String(trade.entryPrice),
      exitPrice: String(trade.exitPrice),
      takeProfit: trade.takeProfit === null ? "" : String(trade.takeProfit),
      stopLoss: trade.stopLoss === null ? "" : String(trade.stopLoss),
      size: String(trade.size),
      pnl: String(Math.abs(trade.pnl)),
      time: toTimeInputValue(new Date(trade.tradeDate)),
      notes: trade.notes ?? "",
    };
  }

  return {
    symbol: "",
    direction: "long" as "long" | "short",
    entryPrice: "",
    exitPrice: "",
    takeProfit: "",
    stopLoss: "",
    size: "",
    pnl: "",
    time: toTimeInputValue(new Date()),
    notes: "",
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
  const [form, setForm] = useState(() => formStateFor(trade));
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

  const pnlSign = computePnlSign(form.direction, form.entryPrice, form.exitPrice);
  const pnlMagnitude = Number(form.pnl);
  const computedPnl =
    form.pnl !== "" && Number.isFinite(pnlMagnitude) ? pnlSign * Math.abs(pnlMagnitude) : null;

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const [hours, minutes] = form.time.split(":").map(Number);
    const tradeDate = new Date(date);
    tradeDate.setHours(hours || 0, minutes || 0, 0, 0);

    const payload = {
      symbol: form.symbol,
      direction: form.direction,
      entryPrice: Number(form.entryPrice),
      exitPrice: Number(form.exitPrice),
      takeProfit: form.takeProfit === "" ? null : Number(form.takeProfit),
      stopLoss: form.stopLoss === "" ? null : Number(form.stopLoss),
      size: Number(form.size),
      pnl: computePnlSign(form.direction, form.entryPrice, form.exitPrice) * Math.abs(Number(form.pnl)),
      tradeDate: tradeDate.toISOString(),
      notes: form.notes,
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
      <p className="mt-1 text-sm text-muted">{formatFullDate(date, locale)}</p>

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
            <Label htmlFor="exitPrice">{t("exitPriceLabel")}</Label>
            <Input
              id="exitPrice"
              name="exitPrice"
              type="number"
              step="any"
              required
              value={form.exitPrice}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="size" className="flex items-center gap-1.5">
              {t("sizeLabel")}
              <InfoTooltip text={t("sizeHint")} />
            </Label>
            <Input
              id="size"
              name="size"
              type="number"
              step="any"
              min="0"
              required
              value={form.size}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div className="space-y-1.5">
            <Label htmlFor="time">{t("timeLabel")}</Label>
            <Input id="time" name="time" type="time" required value={form.time} onChange={handleChange} />
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
