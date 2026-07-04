"use client";

import { useMemo, useState } from "react";
import { NetPnlCard } from "@/components/dashboard/net-pnl-card";
import { Calendar } from "@/components/dashboard/calendar/calendar";
import { useMonthTrades, type TradeDTO } from "@/components/dashboard/trades/use-month-trades";
import { groupTradesByDay } from "@/components/dashboard/trades/trade-stats";
import { TradeReviewModal } from "@/components/dashboard/trades/trade-review-modal";
import { TradeFormModal } from "@/components/dashboard/trades/trade-form-modal";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DashboardOverview() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { trades, refetch } = useMonthTrades(year, month);
  const dailyStats = useMemo(() => groupTradesByDay(trades), [trades]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modal, setModal] = useState<"review" | "form" | null>(null);
  const [editingTrade, setEditingTrade] = useState<TradeDTO | undefined>(undefined);

  function goToPrevMonth() {
    if (month === 0) {
      setYear((prev) => prev - 1);
      setMonth(11);
    } else {
      setMonth((prev) => prev - 1);
    }
  }

  function goToNextMonth() {
    if (month === 11) {
      setYear((prev) => prev + 1);
      setMonth(0);
    } else {
      setMonth((prev) => prev + 1);
    }
  }

  function goToToday() {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  function handleDayClick(date: Date) {
    const dayTrades = trades.filter((trade) => isSameDay(new Date(trade.tradeDate), date));
    setSelectedDate(date);
    setEditingTrade(undefined);
    setModal(dayTrades.length > 0 ? "review" : "form");
  }

  function handleAddTrade() {
    setEditingTrade(undefined);
    setModal("form");
  }

  function handleEditTrade(trade: TradeDTO) {
    setEditingTrade(trade);
    setModal("form");
  }

  function handleCloseModal() {
    setModal(null);
    setEditingTrade(undefined);
    setSelectedDate(null);
  }

  const selectedDayTrades = selectedDate
    ? trades.filter((trade) => isSameDay(new Date(trade.tradeDate), selectedDate))
    : [];

  return (
    <div className="space-y-6 p-6">
      <NetPnlCard dailyStats={dailyStats} />
      <Calendar
        year={year}
        month={month}
        dailyStats={dailyStats}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
        onDayClick={handleDayClick}
      />

      {selectedDate && modal === "review" && (
        <TradeReviewModal
          date={selectedDate}
          trades={selectedDayTrades}
          onClose={handleCloseModal}
          onAddTrade={handleAddTrade}
          onEditTrade={handleEditTrade}
        />
      )}
      {selectedDate && modal === "form" && (
        <TradeFormModal
          date={selectedDate}
          trade={editingTrade}
          onClose={handleCloseModal}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
