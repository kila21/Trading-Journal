"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { BarTrack } from "@/components/ui/bar-track";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { formatRMultiple } from "@/components/dashboard/trades/trade-stats";
import { cn } from "@/lib/utils";
import type { FollowedPlanComparison, MistakeCostRow } from "@/types/trade";

const PLAN_PANEL_TONE_CLASSES = {
  success: {
    border: "border-success/20 bg-success/10",
    text: "text-success",
    textMuted: "text-success/70",
  },
  // "Broke the plan" isn't necessarily a losing trade — process discipline and
  // P&L are independent, so this reads as a caution/process color rather than
  // red, which would wrongly imply the trade lost money.
  warning: {
    border: "border-warning/20 bg-warning/10",
    text: "text-warning",
    textMuted: "text-warning/70",
  },
} as const;

function PlanPanel({
  label,
  totalPnl,
  trades,
  avgAchievedR,
  tone,
}: {
  label: string;
  totalPnl: number;
  trades: number;
  avgAchievedR: number | null;
  tone: keyof typeof PLAN_PANEL_TONE_CLASSES;
}) {
  const t = useTranslations("dashboard");
  const classes = PLAN_PANEL_TONE_CLASSES[tone];
  return (
    <div className={cn("rounded-xl border p-4", classes.border)}>
      <p className={cn("text-sm font-medium", classes.text)}>{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", classes.text)}>{formatPnl(totalPnl)}</p>
      <p className={cn("mt-0.5 text-xs", classes.textMuted)}>
        {avgAchievedR === null
          ? t("trades", { count: trades })
          : t("disciplineSecondary", { count: trades, r: formatRMultiple(avgAchievedR) })}
      </p>
    </div>
  );
}

export function DisciplineCard({
  planComparison,
  mistakeCosts,
}: {
  planComparison: FollowedPlanComparison;
  mistakeCosts: MistakeCostRow[];
}) {
  const t = useTranslations("dashboard");
  const maxAbsCost = Math.max(1, ...mistakeCosts.map((row) => Math.abs(row.totalPnl)));

  return (
    <Card>
      <h2 className="text-lg font-semibold">{t("disciplineTitle")}</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlanPanel
          label={t("followedThePlan")}
          totalPnl={planComparison.followed.totalPnl}
          trades={planComparison.followed.trades}
          avgAchievedR={planComparison.followed.avgAchievedR}
          tone="success"
        />
        <PlanPanel
          label={t("brokeThePlan")}
          totalPnl={planComparison.notFollowed.totalPnl}
          trades={planComparison.notFollowed.trades}
          avgAchievedR={planComparison.notFollowed.avgAchievedR}
          tone="warning"
        />
      </div>

      {mistakeCosts.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-xs text-muted">{t("costByMistake")}</p>
          {mistakeCosts.map((row) => (
            <div
              key={row.tag}
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,2fr)_84px] items-center gap-4"
            >
              <span className="truncate text-sm font-medium text-foreground">{row.tag}</span>
              <span className="whitespace-nowrap text-xs text-muted">{t("trades", { count: row.trades })}</span>
              <BarTrack percent={(Math.abs(row.totalPnl) / maxAbsCost) * 100} tone={row.totalPnl >= 0 ? "success" : "danger"} />
              <span
                className={cn(
                  "text-right text-sm font-semibold",
                  row.totalPnl >= 0 ? "text-success" : "text-danger",
                )}
              >
                {formatPnl(row.totalPnl)}
              </span>
            </div>
          ))}
          <p className="pt-1 text-xs text-muted">{t("costByMistakeFootnote")}</p>
        </div>
      )}
    </Card>
  );
}
