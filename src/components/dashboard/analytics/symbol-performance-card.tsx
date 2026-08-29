"use client";

import { useTranslations } from "next-intl";
import { BarListCard } from "./bar-list-card";
import type { SymbolBreakdownRow } from "@/types/trade";

export function SymbolPerformanceCard({ rows }: { rows: SymbolBreakdownRow[] }) {
  const t = useTranslations("dashboard");

  return (
    <BarListCard
      title={t("performanceBySymbol")}
      labelHeader={t("tableSymbol")}
      emptyMessage={t("symbolBreakdownEmpty")}
      rows={rows.map((row) => ({
        key: row.symbol,
        label: row.symbol,
        trades: row.trades,
        winRate: row.winRate,
        totalPnl: row.totalPnl,
      }))}
    />
  );
}
