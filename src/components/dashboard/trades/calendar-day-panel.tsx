"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { formatFullDate, toLocale } from "@/components/dashboard/calendar/format-date";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { cn } from "@/lib/utils";
import { getTradingSession, sessionTranslationKeys } from "./trading-session";
import type { TradeDTO } from "@/types/trade";

function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Inline day-review panel shown under the dashboard calendar when a day with
 * trades is clicked — the non-modal replacement for the old TradeReviewModal.
 */
export function CalendarDayPanel({ date, trades }: { date: Date; trades: TradeDTO[] }) {
  const t = useTranslations("dashboard");
  const locale = toLocale(useLocale());
  const total = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const isProfit = total >= 0;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
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
        <Link
          href={`/dashboard/trades/new?date=${toDateParam(date)}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("addTrade")}
        </Link>
      </div>

      {trades.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("noTradesYet")}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {trades.map((trade) => {
            const tradeIsProfit = trade.pnl >= 0;
            const session = getTradingSession(new Date(trade.tradeDate));
            return (
              <li key={trade.id}>
                <Link
                  href={`/dashboard/trades/${trade.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/40 p-3 transition-colors hover:bg-background/60"
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
                      {trade.entryPrice} → {trade.exitPrice} · {t("contractsLabel")}: {trade.contracts}
                    </p>
                  </div>
                  <span
                    className={cn("shrink-0 font-semibold", tradeIsProfit ? "text-success" : "text-danger")}
                  >
                    {formatPnl(trade.pnl)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
