"use client";

import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatFullDate, toLocale } from "@/components/dashboard/calendar/format-date";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { cn } from "@/lib/utils";
import { TradeImageGallery } from "./trade-image-gallery";
import { getTradingSession, sessionTranslationKeys } from "./trading-session";
import {
  computeHoldDurationMinutes,
  formatDuration,
  computePlannedR,
  computeAchievedR,
  formatRMultiple,
} from "./trade-stats";
import type { TradeDTO } from "@/types/trade";

// Manual HH:MM formatting (not Intl.DateTimeFormat) deliberately — mirrors
// toTimeInputValue in trade-form.tsx and avoids the server/client ICU
// hydration mismatch documented in format-date.ts/format-pnl.ts.
function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function TradeDetailModal({
  trade,
  onClose,
  onEdit,
}: {
  trade: TradeDTO;
  onClose: () => void;
  onEdit: () => void;
}) {
  const t = useTranslations("dashboard");
  const locale = toLocale(useLocale());
  const isProfit = trade.pnl >= 0;
  const session = getTradingSession(new Date(trade.tradeDate));
  const holdDurationMinutes = computeHoldDurationMinutes(trade);
  const plannedR = computePlannedR(trade);
  const achievedR = computeAchievedR(trade);

  return (
    <Dialog onClose={onClose} className="max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{trade.symbol}</h2>
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
        <span className={cn("text-2xl font-semibold", isProfit ? "text-success" : "text-danger")}>
          {formatPnl(trade.pnl)}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-border bg-background/40 p-4 sm:grid-cols-3">
        <SummaryItem label={t("entryPriceLabel")} value={trade.entryPrice} />
        <SummaryItem label={t("exitPriceLabel")} value={trade.exitPrice} />
        <SummaryItem label={t("contractsLabel")} value={trade.contracts} />
        {trade.takeProfit !== null && <SummaryItem label={t("takeProfitLabel")} value={trade.takeProfit} />}
        {trade.stopLoss !== null && <SummaryItem label={t("stopLossLabel")} value={trade.stopLoss} />}
        <TextSummaryItem label={t("entryTimeLabel")} value={formatTime(new Date(trade.tradeDate))} />
        {trade.exitDate !== null && (
          <TextSummaryItem label={t("exitTimeLabel")} value={formatTime(new Date(trade.exitDate))} />
        )}
        {holdDurationMinutes !== null && (
          <TextSummaryItem label={t("holdDurationLabel")} value={formatDuration(holdDurationMinutes)} />
        )}
        {plannedR !== null && <TextSummaryItem label={t("plannedRLabel")} value={formatRMultiple(plannedR)} />}
        {achievedR !== null && <TextSummaryItem label={t("achievedRLabel")} value={formatRMultiple(achievedR)} />}
        {trade.followedPlan !== null && (
          <TextSummaryItem
            label={t("followedPlanLabel")}
            value={trade.followedPlan ? t("planFollowedYes") : t("planFollowedNo")}
          />
        )}
      </dl>

      {trade.mistakeTags.length > 0 && (
        <div className="mt-4">
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
        <div className="mt-4">
          <p className="text-sm font-medium text-foreground">{t("notesLabel")}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{trade.notes}</p>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">{t("chartTimeframes")}</h3>
        <div className="mt-3">
          <TradeImageGallery tradeId={trade.id} />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onEdit}>
          {t("editTrade")}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          {t("close")}
        </Button>
      </div>
    </Dialog>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function TextSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
