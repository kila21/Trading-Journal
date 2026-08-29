"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { NetPnlCard } from "@/components/dashboard/overview/net-pnl-card";
import { StatsGrid } from "@/components/dashboard/overview/stats-grid";
import { EquityCurveCard } from "@/components/dashboard/overview/equity-curve-card";
import { ViewToggle, type OverviewView } from "@/components/dashboard/overview/view-toggle";
import { DashboardOverviewSkeleton } from "@/components/dashboard/overview/dashboard-overview-skeleton";
import { Calendar } from "@/components/dashboard/calendar/calendar";
import { CalendarAgenda } from "@/components/dashboard/calendar/calendar-agenda";
import { CalendarDayPanel } from "@/components/dashboard/trades/calendar-day-panel";
import { useMediaQuery } from "@/lib/use-media-query";
import { useMonthTrades } from "@/components/dashboard/trades/use-month-trades";
import { groupTradesByDay } from "@/components/dashboard/trades/trade-stats";
import { ErrorState } from "@/components/ui/error-state";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DashboardOverview() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { trades, isLoading, error, refetch } = useMonthTrades(year, month);
  // Derived without an effect (React's documented pattern for "remember this
  // was true at least once") so a month change never re-shows the full-page
  // skeleton — only the very first load does.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  if (!isLoading && !hasLoadedOnce) setHasLoadedOnce(true);

  const dailyStats = useMemo(() => groupTradesByDay(trades), [trades]);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [activeView, setActiveView] = useState<OverviewView>("calendar");
  const [viewTouched, setViewTouched] = useState(false);
  // Default to the agenda list on phones until the user picks a view; once they
  // do, honor their choice at every width.
  const effectiveView: OverviewView = viewTouched ? activeView : isDesktop ? activeView : "agenda";

  function handleViewChange(view: OverviewView) {
    setViewTouched(true);
    setActiveView(view);
  }

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  function goToPrevMonth() {
    setSelectedDate(null);
    if (month === 0) {
      setYear((prev) => prev - 1);
      setMonth(11);
    } else {
      setMonth((prev) => prev - 1);
    }
  }

  function goToNextMonth() {
    setSelectedDate(null);
    if (month === 11) {
      setYear((prev) => prev + 1);
      setMonth(0);
    } else {
      setMonth((prev) => prev + 1);
    }
  }

  function goToToday() {
    setSelectedDate(null);
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  function handleDayClick(date: Date) {
    const dayTrades = trades.filter((trade) => isSameDay(new Date(trade.tradeDate), date));
    if (dayTrades.length === 0) {
      router.push(`/dashboard/trades/new?date=${toDateParam(date)}`);
      return;
    }
    setSelectedDate(date);
  }

  const selectedDayTrades = selectedDate
    ? trades.filter((trade) => isSameDay(new Date(trade.tradeDate), selectedDate))
    : [];

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={t("loadError")} retryLabel={t("retry")} onRetry={refetch} />
      </div>
    );
  }

  if (!hasLoadedOnce && isLoading) {
    return (
      <div className="p-6">
        <DashboardOverviewSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <NetPnlCard year={year} month={month} dailyStats={dailyStats} />
      <StatsGrid dailyStats={dailyStats} trades={trades} />

      <ViewToggle value={effectiveView} onChange={handleViewChange} />

      {effectiveView === "calendar" ? (
        <Calendar
          year={year}
          month={month}
          dailyStats={dailyStats}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
          onDayClick={handleDayClick}
        />
      ) : effectiveView === "agenda" ? (
        <CalendarAgenda
          year={year}
          month={month}
          dailyStats={dailyStats}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
          onDayClick={handleDayClick}
        />
      ) : (
        <EquityCurveCard trades={trades} />
      )}

      {selectedDate && selectedDayTrades.length > 0 && (
        <CalendarDayPanel date={selectedDate} trades={selectedDayTrades} />
      )}
    </div>
  );
}
