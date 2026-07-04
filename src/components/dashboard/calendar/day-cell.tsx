"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { CalendarDay } from "./utils";

export function DayCell({
  day,
  pnlLabel,
  isProfit,
  intensity = 0,
  trades,
  winRate,
}: {
  day: CalendarDay;
  pnlLabel?: string;
  isProfit?: boolean;
  intensity?: number;
  trades?: number;
  winRate?: number;
}) {
  const t = useTranslations("dashboard");
  const hasPnl = typeof pnlLabel === "string";
  const accent = isProfit ? "var(--success)" : "var(--danger)";

  // Tailwind can't statically extract a class name built from a runtime
  // intensity value, so the graded fill/border come from inline styles that
  // mix the success/danger token toward the cell's normal surface color.
  const style: CSSProperties | undefined = hasPnl
    ? {
        backgroundColor: `color-mix(in srgb, ${accent} ${Math.round(intensity * 100)}%, var(--surface))`,
        borderColor: `color-mix(in srgb, ${accent} 50%, var(--border))`,
      }
    : undefined;

  return (
    <div
      className={cn(
        "flex min-h-24 flex-col justify-between rounded-lg border p-2",
        day.isCurrentMonth ? "border-border bg-surface" : "border-transparent bg-background/40 opacity-40",
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-1">
        <span className={cn("text-sm", day.isCurrentMonth ? "text-foreground" : "text-muted")}>
          {day.day}
        </span>
        {typeof winRate === "number" && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              isProfit ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
            )}
          >
            {winRate}%
          </span>
        )}
      </div>
      {hasPnl && (
        <div>
          <span className="block text-sm font-semibold text-foreground">{pnlLabel}</span>
          {typeof trades === "number" && (
            <span className="block text-xs text-muted">{t("trades", { count: trades })}</span>
          )}
        </div>
      )}
    </div>
  );
}
