export type Locale = "en" | "ka";

/**
 * `useLocale()` from next-intl types as plain `string` (no global locale
 * union is configured), so callers normalize it through here once rather
 * than every dictionary lookup needing its own fallback.
 */
export function toLocale(locale: string): Locale {
  return locale === "ka" ? "ka" : "en";
}

/**
 * Weekday/month names are looked up from static per-locale tables instead of
 * `Intl.DateTimeFormat(locale, ...)` on purpose — a prior attempt at
 * locale-aware Intl formatting caused a hydration mismatch, because Node's
 * server-side ICU and the browser's can disagree on locale-specific name/
 * grouping data even for the same locale tag (same root cause documented in
 * format-pnl.ts). Plain array lookups keyed off `Date#getDay`/`getMonth`
 * (which are just numeric, not locale-dependent) render identically on the
 * server and client, so there's nothing left to mismatch.
 */
const weekdayNamesShort: Record<Locale, string[]> = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ka: ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვ"],
};

const weekdayNamesLong: Record<Locale, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ka: ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"],
};

const monthNamesLong: Record<Locale, string[]> = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  ka: [
    "იანვარი",
    "თებერვალი",
    "მარტი",
    "აპრილი",
    "მაისი",
    "ივნისი",
    "ივლისი",
    "აგვისტო",
    "სექტემბერი",
    "ოქტომბერი",
    "ნოემბერი",
    "დეკემბერი",
  ],
};

export function formatMonthYear(date: Date, locale: Locale): string {
  return `${monthNamesLong[locale][date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWeekday(date: Date, locale: Locale): string {
  // getDay() is Sunday=0..Saturday=6; the short-name table is Monday-first to
  // match the calendar grid's Monday-first week layout.
  const mondayFirstIndex = (date.getDay() + 6) % 7;
  return weekdayNamesShort[locale][mondayFirstIndex];
}

export function formatFullDate(date: Date, locale: Locale): string {
  const weekday = weekdayNamesLong[locale][date.getDay()];
  const month = monthNamesLong[locale][date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  // English reads "Weekday, Month Day, Year"; Georgian reads day-before-month.
  return locale === "ka" ? `${weekday}, ${day} ${month}, ${year}` : `${weekday}, ${month} ${day}, ${year}`;
}
