"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { formatRMultiple } from "@/components/dashboard/trades/trade-stats";
import { cn } from "@/lib/utils";

export function PlannedVsAchievedCard({
  avgPlannedR,
  avgAchievedR,
}: {
  avgPlannedR: number | null;
  avgAchievedR: number | null;
}) {
  const t = useTranslations("dashboard");

  if (avgPlannedR === null || avgAchievedR === null) {
    return (
      <Card>
        <h2 className="text-lg font-semibold">{t("plannedVsAchievedTitle")}</h2>
        <p className="mt-4 text-sm text-muted">{t("plannedVsAchievedEmpty")}</p>
      </Card>
    );
  }

  const delta = avgAchievedR - avgPlannedR;
  const tone = delta > 0 ? "success" : delta < 0 ? "danger" : "neutral";
  const hint = delta > 0 ? t("captureExceeding") : delta < 0 ? t("captureShortfall") : t("captureOnTarget");

  return (
    <Card>
      <h2 className="text-lg font-semibold">{t("plannedVsAchievedTitle")}</h2>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted">{t("plannedRLabel")}</p>
            <p className="text-xl font-bold text-foreground">{formatRMultiple(avgPlannedR)}</p>
          </div>
          <span className="text-lg text-muted">→</span>
          <div>
            <p className="text-xs text-muted">{t("achievedRLabel")}</p>
            <p
              className={cn(
                "text-xl font-bold",
                tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-foreground",
              )}
            >
              {formatRMultiple(avgAchievedR)}
            </p>
          </div>
        </div>
        <div className="text-right">
          {tone !== "neutral" && (
            <span
              className={cn(
                "inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
                tone === "success" ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
              )}
            >
              {delta > 0 ? "+" : ""}
              {formatRMultiple(delta)} {t("captureLabel")}
            </span>
          )}
          <p className="mt-1 text-xs text-muted">{hint}</p>
        </div>
      </div>
    </Card>
  );
}
