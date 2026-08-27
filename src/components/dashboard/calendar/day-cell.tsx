"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { CalendarDay } from "@/types/calendar";

export function DayCell({
  day,
  pnlLabel,
  tone,
  intensity = 0,
  trades,
  winRate,
  sessionLabel,
  isWeekend = false,
  onClick,
}: {
  day: CalendarDay;
  pnlLabel?: string;
  tone?: "profit" | "loss" | "neutral";
  intensity?: number;
  trades?: number;
  winRate?: number;
  sessionLabel?: string;
  isWeekend?: boolean;
  onClick?: () => void;
}) {
  const t = useTranslations("dashboard");
  const hasPnl = typeof pnlLabel === "string";
  const accent = tone === "profit" ? "var(--success)" : tone === "loss" ? "var(--danger)" : undefined;
  // An empty weekend (no trades, not today) shrinks and dims so trading
  // weekdays visually dominate the row — weekends still work normally once
  // a trade is logged on one (crypto/forex traders do trade them).
  const isEmptyWeekend = day.isCurrentMonth && isWeekend && !hasPnl && !day.isToday;

  // Tailwind can't statically extract a class name built from a runtime
  // intensity value, so the graded fill/border come from inline styles that
  // mix the success/danger token toward the cell's normal surface color.
  // A "neutral" day (net $0 — e.g. still-open positions) has no accent, so it
  // falls back to the plain surface/border classes below instead of being
  // tinted green.
  const style: CSSProperties | undefined = hasPnl && accent
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
        "flex flex-col justify-between rounded-lg border p-2",
        isEmptyWeekend ? "min-h-14 opacity-60 sm:min-h-16" : "min-h-16 sm:min-h-24",
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
        {sessionLabel && (
          <span className="hidden whitespace-nowrap rounded-full border border-border bg-background/60 px-1.5 py-0.5 text-[10px] font-bold text-foreground sm:inline-block">
            {sessionLabel}
          </span>
        )}
      </div>
      {hasPnl && (
        <div>
          <span className="block truncate text-xs font-semibold text-foreground sm:text-sm">{pnlLabel}</span>
          {typeof trades === "number" && (
            <span className="hidden text-xs text-muted sm:block">{t("trades", { count: trades })}</span>
          )}
          {typeof winRate === "number" && (
            <span className="hidden text-xs text-muted sm:block">{t("winRateStat", { rate: winRate })}</span>
          )}
        </div>
      )}
    </div>
  );
}
