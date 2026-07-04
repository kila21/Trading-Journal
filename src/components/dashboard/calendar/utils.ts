import { formatWeekday } from "./format-date";

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
}

export function buildCalendarWeeks(year: number, month: number): CalendarDay[][] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // JS getDay() is Sunday=0..Saturday=6; shift so the grid starts on Monday.
  const leadingCount = (firstOfMonth.getDay() + 6) % 7;

  const days: CalendarDay[] = [];

  for (let i = leadingCount; i > 0; i--) {
    const date = new Date(year, month, 1 - i);
    days.push({ date, day: date.getDate(), isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push({ date: new Date(year, month, day), day, isCurrentMonth: true });
  }

  let trailing = 1;
  while (days.length % 7 !== 0) {
    days.push({
      date: new Date(year, month + 1, trailing),
      day: trailing,
      isCurrentMonth: false,
    });
    trailing++;
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function getWeekdayLabels(): string[] {
  const monday = new Date(2026, 0, 5); // a known Monday

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return formatWeekday(date);
  });
}
