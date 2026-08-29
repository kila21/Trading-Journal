"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChevronLeftIcon } from "@/components/dashboard/icons";
import { formatFullDate, formatShortDate, toLocale } from "@/components/dashboard/calendar/format-date";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { cn } from "@/lib/utils";
import { TradeImageGallery } from "./trade-image-gallery";
import { getTradingSession, sessionTranslationKeys } from "./trading-session";
import { useTradesRange } from "./use-trades-range";
import { useTradingSettings } from "@/components/dashboard/settings/use-trading-settings";
import {
  computeHoldDurationMinutes,
  formatDuration,
  computePlannedR,
  computeAchievedR,
  computeRiskPercent,
  computeDollarRisk,
  formatRMultiple,
} from "./trade-stats";

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function TradeDetailView({ id }: { id: string }) {
  const t = useTranslations("dashboard");
  const locale = toLocale(useLocale());
  const router = useRouter();
  const { trades, isLoading } = useTradesRange("all");
  const { settings } = useTradingSettings();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const trade = trades.find((item) => item.id === id);

  const backLink = (
    <Link
      href="/dashboard/trades"
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
    >
      <ChevronLeftIcon className="size-4" />
      {t("backToTrades")}
    </Link>
  );

  if (!trade) {
    return (
      <div className="space-y-4 p-6">
        {backLink}
        {!isLoading && <p className="text-sm text-muted">{t("tradeNotFound")}</p>}
      </div>
    );
  }

  const isProfit = trade.pnl >= 0;
  const session = getTradingSession(new Date(trade.tradeDate));
  const holdDurationMinutes = computeHoldDurationMinutes(trade);
  const plannedR = computePlannedR(trade);
  const achievedR = computeAchievedR(trade);
  const riskPercent = computeRiskPercent(trade, settings?.accountBalance ?? null);
  const dollarRisk = computeDollarRisk(trade);

  async function confirmDelete() {
    setConfirmingDelete(false);
    setDeleting(true);
    const response = await fetch(`/api/trades/${id}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/dashboard/trades");
    } else {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      {backLink}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{trade.symbol}</h1>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium",
                trade.direction === "long"
                  ? "border-success/30 bg-success/15 text-success"
                  : "border-danger/30 bg-danger/15 text-danger",
              )}
            >
              {trade.direction === "long" ? t("directionLong") : t("directionShort")}
            </span>
            {session && (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                {t(sessionTranslationKeys[session.name])}
              </span>
            )}
            {trade.setup && (
              <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-xs text-primary">
                {trade.setup}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">{formatFullDate(new Date(trade.tradeDate), locale)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("text-2xl font-semibold", isProfit ? "text-success" : "text-danger")}>
            {formatPnl(trade.pnl)}
          </span>
          <Button variant="outline" onClick={() => router.push(`/dashboard/trades/${id}/edit`)}>
            {t("editTrade")}
          </Button>
        </div>
      </div>

      <Card>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <SummaryItem label={t("entryPriceLabel")} value={String(trade.entryPrice)} />
          <SummaryItem label={t("exitPriceLabel")} value={String(trade.exitPrice)} />
          <SummaryItem label={t("contractsLabel")} value={String(trade.contracts)} />
          {trade.takeProfit !== null && (
            <SummaryItem label={t("takeProfitLabel")} value={String(trade.takeProfit)} />
          )}
          {trade.stopLoss !== null && (
            <SummaryItem label={t("stopLossLabel")} value={String(trade.stopLoss)} />
          )}
          {trade.contractSize && (
            <SummaryItem label={t("contractSizeLabel")} value={trade.contractSize} />
          )}
          <SummaryItem label={t("entryTimeLabel")} value={formatTime(new Date(trade.tradeDate))} />
          {trade.exitDate !== null && (
            <SummaryItem
              label={t("exitTimeLabel")}
              value={
                isSameDay(new Date(trade.tradeDate), new Date(trade.exitDate))
                  ? formatTime(new Date(trade.exitDate))
                  : `${formatShortDate(new Date(trade.exitDate), locale)}, ${formatTime(new Date(trade.exitDate))}`
              }
            />
          )}
          {holdDurationMinutes !== null && (
            <SummaryItem label={t("holdDurationLabel")} value={formatDuration(holdDurationMinutes)} />
          )}
          {plannedR !== null && (
            <SummaryItem label={t("plannedRLabel")} value={formatRMultiple(plannedR)} />
          )}
          {achievedR !== null && (
            <SummaryItem label={t("achievedRLabel")} value={formatRMultiple(achievedR)} />
          )}
          {dollarRisk !== null && (
            <SummaryItem label={t("dollarRiskLabel")} value={formatPnl(-dollarRisk)} />
          )}
          {trade.riskAmount !== null && (
            <SummaryItem label={t("riskAmountLabel")} value={formatPnl(trade.riskAmount)} />
          )}
          {riskPercent !== null && (
            <SummaryItem
              label={t("riskPercentLabel")}
              value={t("riskPercentOfAccount", { percent: riskPercent.toFixed(1) })}
            />
          )}
          {trade.followedPlan !== null && (
            <SummaryItem
              label={t("followedPlanLabel")}
              value={trade.followedPlan ? t("planFollowedYes") : t("planFollowedNo")}
            />
          )}
        </dl>
      </Card>

      {trade.emotions.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground">{t("emotionsLabel")}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {trade.emotions.map((emotion) => (
              <span
                key={emotion}
                className="rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
              >
                {emotion}
              </span>
            ))}
          </div>
        </div>
      )}

      {trade.mistakeTags.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground">{t("mistakeTagsLabel")}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {trade.mistakeTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-danger/30 bg-danger/15 px-2.5 py-1 text-xs font-medium text-danger"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {trade.notes && (
        <div>
          <p className="text-sm font-medium text-foreground">{t("notesLabel")}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{trade.notes}</p>
        </div>
      )}

      <Card>
        <h2 className="text-lg font-semibold">{t("chartTimeframes")}</h2>
        <div className="mt-3">
          <TradeImageGallery tradeId={trade.id} />
        </div>
      </Card>

      <div className="flex justify-end border-t border-border pt-4">
        <Button variant="outline" disabled={deleting} onClick={() => setConfirmingDelete(true)}>
          {t("deleteTrade")}
        </Button>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          message={t("confirmDeleteTrade")}
          confirmLabel={t("deleteTrade")}
          cancelLabel={t("cancel")}
          pending={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
