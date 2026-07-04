"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { formatPnl } from "@/components/dashboard/format-pnl";
import type { DailyStats } from "@/components/dashboard/trades/trade-stats";
import { CalendarHeader } from "./calendar-header";
import { DayCell } from "./day-cell";
import { buildCalendarWeeks, getWeekdayLabels } from "./utils";

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
  const weeks = useMemo(() => buildCalendarWeeks(year, month), [year, month]);
  const weekdayLabels = useMemo(() => getWeekdayLabels(), []);

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
            const intensity = stats
              ? Math.min(1, Math.max(0.3, Math.abs(stats.pnl) / maxAbsPnl))
              : undefined;
            const winRate = stats ? Math.round((stats.wins / stats.trades) * 100) : undefined;

            return (
              <DayCell
                key={`${weekIndex}-${day.date.toISOString()}`}
                day={day}
                pnlLabel={stats ? formatPnl(stats.pnl) : undefined}
                isProfit={stats ? stats.pnl >= 0 : undefined}
                intensity={intensity}
                trades={stats?.trades}
                winRate={winRate}
                onClick={day.isCurrentMonth ? () => onDayClick(day.date) : undefined}
              />
            );
          }),
        )}
      </div>
    </Card>
  );
}
