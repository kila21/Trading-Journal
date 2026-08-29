"use client";

import { useTranslations } from "next-intl";
import { BarListCard } from "./bar-list-card";
import type { DirectionRow } from "@/types/trade";

export function DirectionPerformanceCard({ rows }: { rows: DirectionRow[] }) {
  const t = useTranslations("dashboard");

  return (
    <BarListCard
      title={t("performanceByDirection")}
      labelHeader={t("directionLabel")}
      emptyMessage={t("directionBreakdownEmpty")}
      rows={rows.map((row) => ({
        key: row.direction,
        label: row.direction === "long" ? t("directionLong") : t("directionShort"),
        trades: row.trades,
        winRate: row.winRate,
        totalPnl: row.totalPnl,
      }))}
    />
  );
}
