"use client";

import { useTranslations } from "next-intl";
import { BarListCard } from "./bar-list-card";
import type { EmotionBreakdownRow } from "@/types/trade";

export function EmotionPerformanceCard({ rows }: { rows: EmotionBreakdownRow[] }) {
  const t = useTranslations("dashboard");

  return (
    <BarListCard
      title={t("performanceByEmotion")}
      labelHeader={t("emotionsLabel")}
      emptyMessage={t("emotionBreakdownEmpty")}
      rows={rows.map((row) => ({
        key: row.emotion,
        label: row.emotion,
        trades: row.trades,
        winRate: row.winRate,
        totalPnl: row.totalPnl,
      }))}
    />
  );
}
