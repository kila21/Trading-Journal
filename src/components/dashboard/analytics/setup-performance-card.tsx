"use client";

import { useTranslations } from "next-intl";
import { BarListCard } from "./bar-list-card";
import type { SetupBreakdownRow } from "@/types/trade";

export function SetupPerformanceCard({ rows }: { rows: SetupBreakdownRow[] }) {
  const t = useTranslations("dashboard");

  return (
    <BarListCard
      title={t("performanceBySetup")}
      labelHeader={t("tableSetup")}
      emptyMessage={t("setupBreakdownEmpty")}
      rows={rows.map((row) => ({
        key: row.setup,
        label: row.setup,
        trades: row.trades,
        winRate: row.winRate,
        totalPnl: row.totalPnl,
      }))}
    />
  );
}
