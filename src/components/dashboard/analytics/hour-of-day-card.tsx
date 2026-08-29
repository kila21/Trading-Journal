"use client";

import { useTranslations } from "next-intl";
import { BarListCard } from "./bar-list-card";
import type { HourOfDayRow } from "@/types/trade";

export function HourOfDayCard({ rows }: { rows: HourOfDayRow[] }) {
  const t = useTranslations("dashboard");

  return (
    <BarListCard
      title={t("performanceByHour")}
      labelHeader={t("hourOfDayHeader")}
      emptyMessage={t("hourOfDayEmpty")}
      rows={rows.map((row) => ({
        key: String(row.hour),
        label: `${String(row.hour).padStart(2, "0")}:00`,
        trades: row.trades,
        winRate: row.winRate,
        totalPnl: row.totalPnl,
      }))}
    />
  );
}
