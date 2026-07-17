"use client";

import { useTranslations } from "next-intl";
import { sessionTranslationKeys } from "@/components/dashboard/trades/trading-session";
import { BarListCard } from "./bar-list-card";
import type { SessionBreakdownRow } from "@/types/trade";

export function SessionPerformanceCard({ rows }: { rows: SessionBreakdownRow[] }) {
  const t = useTranslations("dashboard");

  return (
    <BarListCard
      title={t("performanceBySession")}
      labelHeader={t("tableSession")}
      emptyMessage={t("sessionBreakdownEmpty")}
      rows={rows.map((row) => ({
        key: row.session ?? "none",
        label: row.session ? t(sessionTranslationKeys[row.session]) : t("noActiveSession"),
        trades: row.trades,
        winRate: row.winRate,
        totalPnl: row.totalPnl,
      }))}
    />
  );
}
