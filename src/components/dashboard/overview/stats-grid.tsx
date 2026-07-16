"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { StatTile } from "@/components/dashboard/overview/stat-tile";
import { computeMonthSummary, computeMaxDrawdown } from "@/components/dashboard/trades/trade-stats";
import type { DailyStats, TradeDTO } from "@/types/trade";

export function StatsGrid({ dailyStats, trades }: { dailyStats: Map<number, DailyStats>; trades: TradeDTO[] }) {
  const t = useTranslations("dashboard");
  const summary = useMemo(() => computeMonthSummary(dailyStats), [dailyStats]);
  const maxDrawdown = useMemo(() => computeMaxDrawdown(trades), [trades]);
  const hasTrades = dailyStats.size > 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label={t("bestDay")}
        value={summary.bestDay !== null ? formatPnl(summary.bestDay.pnl) : t("noTradesYet")}
        secondary={summary.bestDay !== null ? t("dayOfMonth", { day: summary.bestDay.day }) : undefined}
        tone={summary.bestDay !== null ? (summary.bestDay.pnl >= 0 ? "success" : "danger") : "neutral"}
      />
      <StatTile
        label={t("worstDay")}
        value={
          summary.worstDay !== null ? formatPnl(summary.worstDay.pnl) : t(hasTrades ? "noLosingDay" : "noTradesYet")
        }
        secondary={summary.worstDay !== null ? t("dayOfMonth", { day: summary.worstDay.day }) : undefined}
        tone={summary.worstDay !== null ? "danger" : "neutral"}
      />
      <StatTile
        label={t("maxDrawdown")}
        value={hasTrades ? formatPnl(maxDrawdown) : t("noTradesYet")}
        secondary={hasTrades ? t("fromPeak") : undefined}
        tone={hasTrades ? (maxDrawdown < 0 ? "danger" : "neutral") : "neutral"}
      />
      <StatTile
        label={t("currentStreak")}
        value={
          summary.streak !== null
            ? t(summary.streak.type === "win" ? "streakWin" : "streakLoss", { count: summary.streak.count })
            : t("noTradesYet")
        }
        tone={summary.streak !== null ? (summary.streak.type === "win" ? "success" : "danger") : "neutral"}
      />
    </div>
  );
}
