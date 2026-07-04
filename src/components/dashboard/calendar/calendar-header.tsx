"use client";

import { useTranslations } from "next-intl";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/dashboard/icons";
import { formatMonthYear } from "./format-date";

export function CalendarHeader({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onToday,
}: {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}) {
  const t = useTranslations("dashboard");
  const label = formatMonthYear(new Date(year, month, 1));

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold capitalize">{label}</h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToday}
          className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
        >
          {t("today")}
        </button>
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label={t("prevMonth")}
          className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-background hover:text-foreground"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label={t("nextMonth")}
          className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-background hover:text-foreground"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}
