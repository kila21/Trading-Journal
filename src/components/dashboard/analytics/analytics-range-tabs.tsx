"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { AnalyticsRange } from "@/components/dashboard/trades/use-trades-range";

const RANGES: AnalyticsRange[] = ["month", "90d", "ytd", "all"];

const rangeLabelKey: Record<AnalyticsRange, string> = {
  month: "rangeMonth",
  "90d": "range90d",
  ytd: "rangeYtd",
  all: "rangeAll",
};

export function AnalyticsRangeTabs({
  value,
  onChange,
}: {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
}) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">{t("analyticsTitle")}</h1>
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1">
        {RANGES.map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => onChange(range)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              value === range ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {t(rangeLabelKey[range])}
          </button>
        ))}
      </div>
    </div>
  );
}
