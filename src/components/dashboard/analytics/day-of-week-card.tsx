"use client";

import { useLocale, useTranslations } from "next-intl";
import { getWeekdayLabels } from "@/components/dashboard/calendar/calendar-grid";
import { toLocale } from "@/components/dashboard/calendar/format-date";
import { BarListCard } from "./bar-list-card";
import type { DayOfWeekRow } from "@/types/trade";

export function DayOfWeekCard({ rows }: { rows: DayOfWeekRow[] }) {
  const t = useTranslations("dashboard");
  const weekdayLabels = getWeekdayLabels(toLocale(useLocale()));

  return (
    <BarListCard
      title={t("performanceByDayOfWeek")}
      labelHeader={t("dayOfWeekHeader")}
      emptyMessage={t("dayOfWeekEmpty")}
      rows={rows.map((row) => ({
        key: String(row.weekday),
        label: weekdayLabels[row.weekday] ?? String(row.weekday),
        trades: row.trades,
        winRate: row.winRate,
        totalPnl: row.totalPnl,
      }))}
    />
  );
}
