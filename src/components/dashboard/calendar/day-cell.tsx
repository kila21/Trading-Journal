"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { CalendarDay } from "./calendar-grid";

export function DayCell({
  day,
  pnlLabel,
  isProfit,
  intensity = 0,
  trades,
  winRate,
  onClick,
}: {
  day: CalendarDay;
  pnlLabel?: string;
  isProfit?: boolean;
  intensity?: number;
  trades?: number;
  winRate?: number;
  onClick?: () => void;
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
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "flex min-h-24 flex-col justify-between rounded-lg border p-2",
        onClick && "cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary",
        day.isCurrentMonth ? "border-border bg-surface" : "border-transparent bg-background/40 opacity-40",
        day.isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            "text-sm",
            day.isToday ? "font-semibold text-primary" : day.isCurrentMonth ? "text-foreground" : "text-muted",
          )}
        >
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
          {typeof winRate === "number" && (
            <span className="block text-xs text-muted">{t("winRateStat", { rate: winRate })}</span>
          )}
        </div>
      )}
    </div>
  );
}
