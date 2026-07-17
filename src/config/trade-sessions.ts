// Standard ICT "Kill Zone" windows — narrow, high-probability trading windows,
// not broad all-day market-open blocks — expressed in America/New_York local
// time (not UTC). A trade's timestamp is converted to actual NY wall-clock
// time (DST-aware, see trading-session.ts) before being matched against these
// bounds, so the session shown is correct year-round regardless of the
// trader's own timezone. Most of the day intentionally falls outside every
// window — that's expected, not a bug. Asian wraps past midnight (20:00 ->
// 00:00 next day).
export const tradingSessions = [
  { name: "Asian", start: "20:00", end: "00:00" },
  { name: "London", start: "02:00", end: "05:00" },
  { name: "NY AM", start: "08:30", end: "11:00" },
  { name: "NY Lunch", start: "12:00", end: "13:30" },
  { name: "NY PM", start: "13:30", end: "16:00" },
] as const;
