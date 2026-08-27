"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatPnl } from "@/components/dashboard/format-pnl";
import type { WeekSummary } from "@/types/trade";

export function WeekSummaryBar({ summary, className }: { summary: WeekSummary | null; className?: string }) {
  const t = useTranslations("dashboard");
  const tone = summary ? (summary.pnl > 0 ? "profit" : summary.pnl < 0 ? "loss" : "neutral") : undefined;
  const accent = tone === "profit" ? "var(--success)" : tone === "loss" ? "var(--danger)" : undefined;
  const winRate = summary && summary.trades > 0 ? Math.round((summary.wins / summary.trades) * 100) : undefined;

  return (
    <div
      className={cn(
        "flex shrink-0 flex-row items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2 lg:w-36 lg:flex-col lg:items-start lg:justify-center",
        className,
      )}
      style={accent ? { borderColor: `color-mix(in srgb, ${accent} 40%, var(--border))` } : undefined}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{t("weekSummaryLabel")}</span>
      {summary ? (
        <div className="text-right lg:text-left">
          <span
            className={cn(
              "block text-sm font-semibold",
              tone === "profit" ? "text-success" : tone === "loss" ? "text-danger" : "text-foreground",
            )}
          >
            {formatPnl(summary.pnl)}
          </span>
          <span className="block text-xs text-muted">{t("trades", { count: summary.trades })}</span>
          {typeof winRate === "number" && (
            <span className="block text-xs text-muted">{t("winRateStat", { rate: winRate })}</span>
          )}
        </div>
      ) : (
        <span className="text-xs text-muted">{t("weekSummaryEmpty")}</span>
      )}
    </div>
  );
}
