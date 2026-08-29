"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { TrendDownIcon, TrendUpIcon } from "@/components/dashboard/icons";
import { formatMonthYear, toLocale } from "@/components/dashboard/calendar/format-date";
import { cn } from "@/lib/utils";
import type { DailyStats } from "@/types/trade";

export function NetPnlCard({
  year,
  month,
  dailyStats,
}: {
  year: number;
  month: number;
  dailyStats: Map<number, DailyStats>;
}) {
  const t = useTranslations("dashboard");
  const locale = toLocale(useLocale());
  const monthYearLabel = formatMonthYear(new Date(year, month, 1), locale);

  let total = 0;
  let trades = 0;
  let wins = 0;

  for (const day of dailyStats.values()) {
    total += day.pnl;
    trades += day.trades;
    wins += day.wins;
  }

  const isProfit = total >= 0;
  const formatted = formatPnl(total);
  const winRate = trades > 0 ? Math.round((wins / trades) * 100) : 0;
  const TrendIcon = isProfit ? TrendUpIcon : TrendDownIcon;

  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full",
            isProfit ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
          )}
        >
          <TrendIcon className="size-6" />
        </div>
        <div>
          <p className="text-sm text-muted">
            {t("netPnl")} <span className="capitalize">· {monthYearLabel}</span>
          </p>
          <p
            className={cn(
              "mt-0.5 text-3xl font-semibold",
              isProfit ? "text-success" : "text-danger",
            )}
          >
            {formatted}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted">{t("trades", { count: trades })}</p>
        <span
          className={cn(
            "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
            isProfit ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
          )}
        >
          {winRate}%
        </span>
      </div>
    </Card>
  );
}
