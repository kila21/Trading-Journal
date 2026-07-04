/**
 * Pinned to a fixed locale deliberately — money is kept in one consistent
 * notation regardless of UI language. Formatting currency with the active
 * next-intl locale caused a hydration mismatch: Node's server-side Intl
 * engine and the browser's can disagree on locale-specific currency
 * formatting (e.g. symbol placement, grouping) even for the same locale tag.
 */
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
});

export function formatPnl(amount: number): string {
  return currencyFormatter.format(amount);
}
