"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { formatPnl } from "@/components/dashboard/format-pnl";
import { getTradingSession, sessionTranslationKeys } from "@/components/dashboard/trades/trading-session";
import { cn } from "@/lib/utils";
import type { DailyStats } from "@/types/trade";
import { formatShortDate, toLocale } from "./format-date";
import { CalendarHeader } from "./calendar-header";

/**
 * Small-screen alternative to the 7-column month grid: a scrollable list of
 * the month's trading days, newest first. Same data as the calendar
 * (dailyStats) and the same day-click behavior.
 */
export function CalendarAgenda({
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

  const days = useMemo(
    () => Array.from(dailyStats.keys()).sort((a, b) => b - a),
    [dailyStats],
  );

  return (
    <Card>
      <CalendarHeader
        year={year}
        month={month}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onToday={onToday}
      />

      {days.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("agendaEmpty")}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {days.map((day) => {
            const stats = dailyStats.get(day)!;
            const date = new Date(year, month, day);
            const session = getTradingSession(new Date(stats.firstTradeDate));
            const winRate = Math.round((stats.wins / stats.trades) * 100);
            const isProfit = stats.pnl >= 0;
            return (
              <li key={day}>
                <button
                  type="button"
                  onClick={() => onDayClick(date)}
                  className="flex w-full flex-col gap-2 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:bg-background/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-foreground">{formatShortDate(date, locale)}</span>
                    <span className={cn("font-semibold", isProfit ? "text-success" : "text-danger")}>
                      {formatPnl(stats.pnl)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span>{t("netPnlSecondary", { count: stats.trades, rate: winRate })}</span>
                    {session && (
                      <>
                        <span aria-hidden>·</span>
                        <span>{t(sessionTranslationKeys[session.name])}</span>
                      </>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
