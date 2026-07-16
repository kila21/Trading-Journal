"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { getTradingSession, sessionTranslationKeys } from "@/components/dashboard/trades/trading-session";
import type { DailyStats } from "@/types/trade";
import { toLocale } from "./format-date";
import { CalendarHeader } from "./calendar-header";
import { DayCell } from "./day-cell";
import { buildCalendarWeeks, getWeekdayLabels } from "./calendar-grid";

export function Calendar({
  year,
  month,
  dailyStats,
  onPrevMonth,
  onNextMonth,
  onToday,
  onDayClick,
}: {
  year: number;
  month: number;
  dailyStats: Map<number, DailyStats>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onDayClick: (date: Date) => void;
}) {
  const t = useTranslations("dashboard");
  const locale = toLocale(useLocale());
  const weeks = useMemo(() => buildCalendarWeeks(year, month), [year, month]);
  const weekdayLabels = useMemo(() => getWeekdayLabels(locale), [locale]);

  // Shade intensity is relative to the biggest win/loss in the visible month,
  // so the standout day is always fully saturated and quieter days still read
  // as green/red rather than nearly invisible.
  const maxAbsPnl = useMemo(() => {
    const values = Array.from(dailyStats.values(), (day) => Math.abs(day.pnl));
    return values.length > 0 ? Math.max(...values) : 1;
  }, [dailyStats]);

  return (
    <Card>
      <CalendarHeader
        year={year}
        month={month}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
      />
      <div className="mt-4 grid grid-cols-7 gap-2">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium uppercase text-muted"
          >
            {label}
          </div>
        ))}
        {weeks.map((week, weekIndex) =>
          week.map((day) => {
            const stats = day.isCurrentMonth ? dailyStats.get(day.day) : undefined;
            const tone = stats ? (stats.pnl > 0 ? "profit" : stats.pnl < 0 ? "loss" : "neutral") : undefined;
            const intensity = stats
              ? Math.min(1, Math.max(0.3, Math.abs(stats.pnl) / maxAbsPnl))
              : undefined;
            const winRate = stats ? Math.round((stats.wins / stats.trades) * 100) : undefined;
            const session = stats ? getTradingSession(new Date(stats.firstTradeDate)) : null;

            return (
              <DayCell
                key={`${weekIndex}-${day.date.toISOString()}`}
                day={day}
                pnlLabel={stats ? formatPnl(stats.pnl) : undefined}
                tone={tone}
                intensity={intensity}
                trades={stats?.trades}
                winRate={winRate}
                sessionLabel={session ? t(sessionTranslationKeys[session.name]) : undefined}
                onClick={day.isCurrentMonth ? () => onDayClick(day.date) : undefined}
              />
            );
          }),
        )}
      </div>
    </Card>
  );
}
