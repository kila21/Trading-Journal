"use client";

import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatFullDate, toLocale } from "@/components/dashboard/calendar/format-date";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { cn } from "@/lib/utils";
import { getTradingSession, sessionTranslationKeys } from "./trading-session";
import type { TradeDTO } from "./use-month-trades";

export function TradeReviewModal({
  date,
  trades,
  onClose,
  onAddTrade,
  onEditTrade,
  onReviewTrade,
}: {
  date: Date;
  trades: TradeDTO[];
  onClose: () => void;
  onAddTrade: () => void;
  onEditTrade: (trade: TradeDTO) => void;
  onReviewTrade: (trade: TradeDTO) => void;
}) {
  const t = useTranslations("dashboard");
  const locale = toLocale(useLocale());
  const total = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const isProfit = total >= 0;

  return (
    <Dialog onClose={onClose} className="max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{formatFullDate(date, locale)}</h2>
          <p className="mt-1 text-sm text-muted">
            {t("reviewDayTotal")}{" "}
            <span className={cn("font-semibold", isProfit ? "text-success" : "text-danger")}>
              {formatPnl(total)}
            </span>
            {" · "}
            {t("trades", { count: trades.length })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onAddTrade}>
          {t("addTrade")}
        </Button>
      </div>

      <ul className="mt-4 space-y-2">
        {trades.map((trade) => {
          const tradeIsProfit = trade.pnl >= 0;
          const session = getTradingSession(new Date(trade.tradeDate));
          return (
            <li
              key={trade.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/40 p-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{trade.symbol}</span>
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
                      trade.direction === "long"
                        ? "border-success/30 bg-success/15 text-success"
                        : "border-danger/30 bg-danger/15 text-danger",
                    )}
                  >
                    {trade.direction === "long" ? t("directionLong") : t("directionShort")}
                  </span>
                  {session && (
                    <span className="whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                      {t(sessionTranslationKeys[session.name])}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-muted">
                  {trade.entryPrice} → {trade.exitPrice} · {t("sizeLabel")}: {trade.size}
                  {trade.takeProfit !== null && ` · ${t("takeProfitLabel")}: ${trade.takeProfit}`}
                  {trade.stopLoss !== null && ` · ${t("stopLossLabel")}: ${trade.stopLoss}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={cn("font-semibold", tradeIsProfit ? "text-success" : "text-danger")}>
                  {formatPnl(trade.pnl)}
                </span>
                <Button variant="ghost" size="sm" onClick={() => onReviewTrade(trade)}>
                  {t("review")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEditTrade(trade)}>
                  {t("edit")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          {t("close")}
        </Button>
      </div>
    </Dialog>
  );
}
