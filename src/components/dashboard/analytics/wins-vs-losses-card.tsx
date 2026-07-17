"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/dashboard/overview/stat-tile";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { formatShortDate, toLocale } from "@/components/dashboard/calendar/format-date";
import type { WinLossBreakdown } from "@/types/trade";

export function WinsVsLossesCard({ breakdown }: { breakdown: WinLossBreakdown }) {
  const t = useTranslations("dashboard");
  const locale = toLocale(useLocale());

  return (
    <Card>
      <h2 className="text-lg font-semibold">{t("winsVsLossesTitle")}</h2>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label={t("avgWin")}
          value={breakdown.avgWin === null ? "—" : formatPnl(breakdown.avgWin)}
          secondary={breakdown.avgWin === null ? undefined : t("trades", { count: breakdown.winCount })}
          tone={breakdown.avgWin === null ? "neutral" : "success"}
        />
        <StatTile
          label={t("avgLoss")}
          value={breakdown.avgLoss === null ? "—" : formatPnl(breakdown.avgLoss)}
          secondary={breakdown.avgLoss === null ? undefined : t("trades", { count: breakdown.lossCount })}
          tone={breakdown.avgLoss === null ? "neutral" : "danger"}
        />
        <StatTile
          label={t("largestWin")}
          value={breakdown.largestWin === null ? "—" : formatPnl(breakdown.largestWin.pnl)}
          secondary={
            breakdown.largestWin === null
              ? undefined
              : `${breakdown.largestWin.symbol} · ${formatShortDate(new Date(breakdown.largestWin.tradeDate), locale)}`
          }
          tone={breakdown.largestWin === null ? "neutral" : "success"}
        />
        <StatTile
          label={t("winLossRatio")}
          value={breakdown.ratio === null ? "—" : breakdown.ratio.toFixed(2)}
          secondary={breakdown.ratio === null ? undefined : t("winLossRatioSecondary")}
        />
      </div>
    </Card>
  );
}
