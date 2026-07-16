// Standard forex/futures market session hours, expressed in America/New_York
// local time (not UTC) — a trade's timestamp is converted to actual NY wall-
// clock time (DST-aware, see trading-session.ts) before being matched against
// these bounds, so the session shown is correct year-round regardless of the
// trader's own timezone. New York is split into its AM/Lunch/PM sub-sessions
// rather than one block, since that's how ICT-style analysis actually
// segments the NY day. Asian wraps past midnight (20:00 -> 05:00 next day).
export const tradingSessions = [
  { name: "Asian", start: "20:00", end: "05:00" },
  { name: "London", start: "04:00", end: "13:00" },
  { name: "NY AM", start: "09:00", end: "13:00" },
  { name: "NY Lunch", start: "13:00", end: "14:30" },
  { name: "NY PM", start: "14:30", end: "18:00" },
] as const;
