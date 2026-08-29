"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { BarTrack } from "@/components/ui/bar-track";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { formatRMultiple } from "@/components/dashboard/trades/trade-stats";
import { cn } from "@/lib/utils";
import type { RBucket } from "@/types/trade";

const LOW_SAMPLE_THRESHOLD = 10;

function bucketLabel(bucket: RBucket): string {
  if (bucket.min === null) return `≤ ${bucket.max}R`;
  if (bucket.max === null) return `> ${bucket.min}R`;
  return `${bucket.min}R … ${bucket.max}R`;
}

export function RDistributionCard({
  buckets,
  expectancyR,
  tradeCount,
}: {
  buckets: RBucket[];
  expectancyR: number | null;
  tradeCount: number;
}) {
  const t = useTranslations("dashboard");
  const totalRated = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));

  if (totalRated === 0) {
    return (
      <Card>
        <h2 className="text-lg font-semibold">{t("rDistributionTitle")}</h2>
        <p className="mt-4 text-sm text-muted">{t("rDistributionEmpty")}</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("rDistributionTitle")}</h2>
        {expectancyR !== null && (
          <span className="text-sm text-muted">
            {t("expectancyRLabel")}:{" "}
            <span className={cn("font-semibold", expectancyR >= 0 ? "text-success" : "text-danger")}>
              {formatRMultiple(expectancyR)}
            </span>
          </span>
        )}
      </div>
      {tradeCount > 0 && tradeCount < LOW_SAMPLE_THRESHOLD && (
        <p className="mt-1 text-xs font-medium text-warning">{t("lowSample")}</p>
      )}

      <div className="mt-4 space-y-3">
        {buckets.map((bucket) => {
          const positive = (bucket.min ?? bucket.max ?? 0) >= 0;
          return (
            <div
              key={bucket.key}
              className="grid grid-cols-[76px_32px_minmax(0,1fr)_84px] items-center gap-4"
            >
              <span className="text-sm font-medium text-foreground">{bucketLabel(bucket)}</span>
              <span className="text-sm text-muted">{bucket.count}</span>
              <BarTrack percent={(bucket.count / maxCount) * 100} tone={positive ? "success" : "danger"} />
              <span
                className={cn(
                  "text-right text-sm font-semibold",
                  bucket.totalPnl >= 0 ? "text-success" : "text-danger",
                )}
              >
                {formatPnl(bucket.totalPnl)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
