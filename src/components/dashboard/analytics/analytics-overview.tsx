"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/ui/error-state";
import { AnalyticsSkeleton } from "./analytics-skeleton";
import { StatTile } from "@/components/dashboard/overview/stat-tile";
import { EquityCurveCard } from "@/components/dashboard/overview/equity-curve-card";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { useTradesRange, type AnalyticsRange } from "@/components/dashboard/trades/use-trades-range";
import { useTradingSettings } from "@/components/dashboard/settings/use-trading-settings";
import {
  computeProfitFactor,
  computeExpectancy,
  computeMaxDrawdownDetail,
  computePlannedR,
  computeAchievedR,
  computeWinLossBreakdown,
  computeAverageRiskPercent,
  computeRMultipleDistribution,
  computeExpectancyR,
  computeHoldTimeComparison,
  computeHoldTimeBuckets,
  computeConsecutiveStreaks,
} from "@/components/dashboard/trades/trade-stats";
import {
  computeSetupBreakdown,
  computeSessionBreakdown,
  computeMistakeCostBreakdown,
  computeFollowedPlanComparison,
  computeSymbolBreakdown,
  computeDirectionBreakdown,
  computeDayOfWeekBreakdown,
  computeHourOfDayBreakdown,
  computeEmotionBreakdown,
} from "@/components/dashboard/trades/trade-breakdown-stats";
import { AnalyticsRangeTabs } from "./analytics-range-tabs";
import { PlannedVsAchievedCard } from "./planned-vs-achieved-card";
import { SetupPerformanceCard } from "./setup-performance-card";
import { SessionPerformanceCard } from "./session-performance-card";
import { DisciplineCard } from "./discipline-card";
import { WinsVsLossesCard } from "./wins-vs-losses-card";
import { RDistributionCard } from "./r-distribution-card";
import { DayOfWeekCard } from "./day-of-week-card";
import { HourOfDayCard } from "./hour-of-day-card";
import { HoldTimeCard } from "./hold-time-card";
import { SymbolPerformanceCard } from "./symbol-performance-card";
import { DirectionPerformanceCard } from "./direction-performance-card";
import { EmotionPerformanceCard } from "./emotion-performance-card";
import { StreaksCard } from "./streaks-card";

const LOW_SAMPLE_THRESHOLD = 10;

function average(values: number[]): number | null {
  return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}

export function AnalyticsOverview() {
  const t = useTranslations("dashboard");
  const [range, setRange] = useState<AnalyticsRange>("month");

  const { trades, isLoading, error, refetch } = useTradesRange(range);
  // Derived without an effect so a range change never re-shows the full skeleton.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  if (!isLoading && !hasLoadedOnce) setHasLoadedOnce(true);

  const { settings } = useTradingSettings();
  const accountBalance = settings?.accountBalance ?? null;

  const netPnl = useMemo(() => trades.reduce((sum, trade) => sum + trade.pnl, 0), [trades]);
  const avgRiskPercent = useMemo(
    () => computeAverageRiskPercent(trades, accountBalance),
    [trades, accountBalance],
  );
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
  const rDistribution = useMemo(() => computeRMultipleDistribution(trades), [trades]);
  const expectancyR = useMemo(() => computeExpectancyR(trades), [trades]);
  const holdComparison = useMemo(() => computeHoldTimeComparison(trades), [trades]);
  const holdBuckets = useMemo(() => computeHoldTimeBuckets(trades), [trades]);
  const streaks = useMemo(() => computeConsecutiveStreaks(trades), [trades]);
  const symbolBreakdown = useMemo(() => computeSymbolBreakdown(trades), [trades]);
  const directionBreakdown = useMemo(() => computeDirectionBreakdown(trades), [trades]);
  const dayOfWeekBreakdown = useMemo(() => computeDayOfWeekBreakdown(trades), [trades]);
  const hourOfDayBreakdown = useMemo(() => computeHourOfDayBreakdown(trades), [trades]);
  const emotionBreakdown = useMemo(() => computeEmotionBreakdown(trades), [trades]);

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <AnalyticsRangeTabs value={range} onChange={setRange} />
        <ErrorState message={t("loadError")} retryLabel={t("retry")} onRetry={refetch} />
      </div>
    );
  }

  if (!hasLoadedOnce && isLoading) {
    return (
      <div className="space-y-6 p-6">
        <AnalyticsRangeTabs value={range} onChange={setRange} />
        <AnalyticsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <AnalyticsRangeTabs value={range} onChange={setRange} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          warning={trades.length > 0 && trades.length < LOW_SAMPLE_THRESHOLD ? t("lowSample") : undefined}
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
        {avgRiskPercent !== null && (
          <StatTile label={t("avgRiskPercent")} value={`${avgRiskPercent.toFixed(1)}%`} />
        )}
      </div>

      <EquityCurveCard trades={trades} />

      <PlannedVsAchievedCard avgPlannedR={avgPlannedR} avgAchievedR={avgAchievedR} />

      <RDistributionCard buckets={rDistribution} expectancyR={expectancyR} tradeCount={trades.length} />

      <StreaksCard streaks={streaks} />

      <DisciplineCard planComparison={planComparison} mistakeCosts={mistakeCosts} />

      <EmotionPerformanceCard rows={emotionBreakdown} />

      <WinsVsLossesCard breakdown={winLossBreakdown} />

      <HoldTimeCard comparison={holdComparison} buckets={holdBuckets} />

      <SessionPerformanceCard rows={sessionBreakdown} />

      <SetupPerformanceCard rows={setupBreakdown} />

      <SymbolPerformanceCard rows={symbolBreakdown} />

      <DirectionPerformanceCard rows={directionBreakdown} />

      <DayOfWeekCard rows={dayOfWeekBreakdown} />

      <HourOfDayCard rows={hourOfDayBreakdown} />
    </div>
  );
}
