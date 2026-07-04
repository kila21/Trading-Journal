/**
 * Pinned to a fixed locale on purpose: formatting month/weekday names with
 * the active UI locale caused a hydration mismatch for `ka` — Node's
 * server-side Intl and the browser's client-side locale resolution disagreed
 * (same root cause as the currency formatting in format-pnl.ts). Showing the
 * original English month/weekday names in every locale sidesteps it.
 */
const monthYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function formatMonthYear(date: Date): string {
  return monthYearFormatter.format(date);
}

export function formatWeekday(date: Date): string {
  return weekdayFormatter.format(date);
}

export function formatFullDate(date: Date): string {
  return fullDateFormatter.format(date);
}
