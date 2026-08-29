"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { BarTrack } from "@/components/ui/bar-track";
import { StatTile } from "@/components/dashboard/overview/stat-tile";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { formatDuration } from "@/components/dashboard/trades/trade-stats";
import { cn } from "@/lib/utils";
import type { HoldBucket, HoldTimeComparison } from "@/types/trade";

const BUCKET_LABEL_KEYS: Record<string, string> = {
  lt15: "holdBucketLt15",
  "15to60": "holdBucket15to60",
  "1to4h": "holdBucket1to4h",
  "4to24h": "holdBucket4to24h",
  gt1d: "holdBucketGt1d",
};

export function HoldTimeCard({
  comparison,
  buckets,
}: {
  comparison: HoldTimeComparison;
  buckets: HoldBucket[];
}) {
  const t = useTranslations("dashboard");
  const maxAbsPnl = Math.max(1, ...buckets.map((bucket) => Math.abs(bucket.totalPnl)));

  if (
    comparison.avgWinnerMinutes === null &&
    comparison.avgLoserMinutes === null &&
    buckets.length === 0
  ) {
    return (
      <Card>
        <h2 className="text-lg font-semibold">{t("holdTimeTitle")}</h2>
        <p className="mt-4 text-sm text-muted">{t("holdTimeEmpty")}</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">{t("holdTimeTitle")}</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile
          label={t("avgWinnerHold")}
          value={
            comparison.avgWinnerMinutes === null
              ? "—"
              : formatDuration(Math.round(comparison.avgWinnerMinutes))
          }
          tone={comparison.avgWinnerMinutes === null ? "neutral" : "success"}
        />
        <StatTile
          label={t("avgLoserHold")}
          value={
            comparison.avgLoserMinutes === null
              ? "—"
              : formatDuration(Math.round(comparison.avgLoserMinutes))
          }
          tone={comparison.avgLoserMinutes === null ? "neutral" : "danger"}
        />
      </div>

      {buckets.length > 0 && (
        <div className="mt-6 space-y-3">
          {buckets.map((bucket) => (
            <div
              key={bucket.key}
              className="grid grid-cols-[minmax(0,1fr)_52px_44px_minmax(0,1.6fr)_84px] items-center gap-4"
            >
              <span className="truncate text-sm font-medium text-foreground">
                {t(BUCKET_LABEL_KEYS[bucket.key])}
              </span>
              <span className="text-sm text-muted">{bucket.trades}</span>
              <span className="text-sm text-muted">{Math.round(bucket.winRate * 100)}%</span>
              <BarTrack
                percent={(Math.abs(bucket.totalPnl) / maxAbsPnl) * 100}
                tone={bucket.totalPnl >= 0 ? "success" : "danger"}
              />
              <span
                className={cn(
                  "text-right text-sm font-semibold",
                  bucket.totalPnl >= 0 ? "text-success" : "text-danger",
                )}
              >
                {formatPnl(bucket.totalPnl)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
