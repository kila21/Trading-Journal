"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { StatTile } from "@/components/dashboard/overview/stat-tile";
import { EquityCurveCard } from "@/components/dashboard/overview/equity-curve-card";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { useTradesRange, type AnalyticsRange } from "@/components/dashboard/trades/use-trades-range";
import {
  computeProfitFactor,
  computeExpectancy,
  computeMaxDrawdownDetail,
  computePlannedR,
  computeAchievedR,
  computeWinLossBreakdown,
} from "@/components/dashboard/trades/trade-stats";
import {
  computeSetupBreakdown,
  computeSessionBreakdown,
  computeMistakeCostBreakdown,
  computeFollowedPlanComparison,
} from "@/components/dashboard/trades/trade-breakdown-stats";
import { AnalyticsRangeTabs } from "./analytics-range-tabs";
import { PlannedVsAchievedCard } from "./planned-vs-achieved-card";
import { SetupPerformanceCard } from "./setup-performance-card";
import { SessionPerformanceCard } from "./session-performance-card";
import { DisciplineCard } from "./discipline-card";
import { WinsVsLossesCard } from "./wins-vs-losses-card";

const LOW_SAMPLE_THRESHOLD = 10;

function average(values: number[]): number | null {
  return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}

export function AnalyticsOverview() {
  const t = useTranslations("dashboard");
  const [range, setRange] = useState<AnalyticsRange>("month");

  const { trades } = useTradesRange(range);

  const netPnl = useMemo(() => trades.reduce((sum, trade) => sum + trade.pnl, 0), [trades]);
  const wins = useMemo(() => trades.filter((trade) => trade.pnl >= 0).length, [trades]);
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;

  const profitFactor = useMemo(() => computeProfitFactor(trades), [trades]);
  const expectancy = useMemo(() => computeExpectancy(trades), [trades]);
  const drawdown = useMemo(() => computeMaxDrawdownDetail(trades), [trades]);
  const avgPlannedR = useMemo(
    () => average(trades.map(computePlannedR).filter((r): r is number => r !== null)),
    [trades],
  );
  const avgAchievedR = useMemo(
    () => average(trades.map(computeAchievedR).filter((r): r is number => r !== null)),
    [trades],
  );
  const planComparison = useMemo(() => computeFollowedPlanComparison(trades), [trades]);
  const mistakeCosts = useMemo(() => computeMistakeCostBreakdown(trades), [trades]);
  const winLossBreakdown = useMemo(() => computeWinLossBreakdown(trades), [trades]);
  const setupBreakdown = useMemo(() => computeSetupBreakdown(trades), [trades]);
  const sessionBreakdown = useMemo(() => computeSessionBreakdown(trades), [trades]);

  return (
    <div className="space-y-6 p-6">
      <AnalyticsRangeTabs value={range} onChange={setRange} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label={t("netPnl")}
          value={formatPnl(netPnl)}
          secondary={trades.length > 0 ? t("netPnlSecondary", { count: trades.length, rate: winRate }) : undefined}
          tone={trades.length === 0 ? "neutral" : netPnl >= 0 ? "success" : "danger"}
        />
        <StatTile
          label={t("profitFactor")}
          value={profitFactor === null ? "—" : profitFactor.toFixed(2)}
          warning={trades.length > 0 && trades.length < LOW_SAMPLE_THRESHOLD ? t("lowSample") : undefined}
        />
        <StatTile
          label={t("expectancy")}
          value={expectancy === null ? "—" : formatPnl(expectancy)}
          secondary={expectancy === null ? undefined : t("perTrade")}
          tone={expectancy === null ? "neutral" : expectancy >= 0 ? "success" : "danger"}
        />
        <StatTile
          label={t("maxDrawdown")}
          value={formatPnl(drawdown.amount)}
          secondary={
            trades.length === 0
              ? undefined
              : drawdown.percent !== null
                ? t("maxDrawdownSecondary", { percent: Math.round(drawdown.percent) })
                : t("fromPeak")
          }
          tone={drawdown.amount < 0 ? "danger" : "neutral"}
        />
      </div>

      <EquityCurveCard trades={trades} />

      <PlannedVsAchievedCard avgPlannedR={avgPlannedR} avgAchievedR={avgAchievedR} />

      <DisciplineCard planComparison={planComparison} mistakeCosts={mistakeCosts} />

      <WinsVsLossesCard breakdown={winLossBreakdown} />

      <SessionPerformanceCard rows={sessionBreakdown} />

      <SetupPerformanceCard rows={setupBreakdown} />
    </div>
  );
}
