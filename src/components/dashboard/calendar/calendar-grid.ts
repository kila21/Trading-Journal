// Builds the Monday-first week grid for the calendar and its weekday labels.
import { formatWeekday } from "./format-date";
import type { Locale, CalendarDay } from "@/types/calendar";

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function buildCalendarWeeks(year: number, month: number): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // JS getDay() is Sunday=0..Saturday=6; shift so the grid starts on Monday.
  const leadingCount = (firstOfMonth.getDay() + 6) % 7;
  const today = new Date();

  const days: CalendarDay[] = [];

  for (let i = leadingCount; i > 0; i--) {
    const date = new Date(year, month, 1 - i);
    days.push({ date, day: date.getDate(), isCurrentMonth: false, isToday: isSameDate(date, today) });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    days.push({ date, day, isCurrentMonth: true, isToday: isSameDate(date, today) });
  }

  let trailing = 1;
  while (days.length % 7 !== 0) {
    const date = new Date(year, month + 1, trailing);
    days.push({
      date,
      day: trailing,
      isCurrentMonth: false,
      isToday: isSameDate(date, today),
    });
    trailing++;
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function getWeekdayLabels(locale: Locale): string[] {
  const monday = new Date(2026, 0, 5); // a known Monday

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return formatWeekday(date, locale);
  });
}
