// Standard forex/futures market session hours, in UTC — approximate, ignores
// DST shifts (same simplification level as trade-timeframes.ts). New York is
// split into its AM/Lunch/PM sub-sessions rather than one block, since that's
// how ICT-style analysis actually segments the NY day.
export const tradingSessions = [
  { name: "Asian", start: "00:00", end: "09:00" },
  { name: "London", start: "08:00", end: "17:00" },
  { name: "NY AM", start: "13:00", end: "17:00" },
  { name: "NY Lunch", start: "17:00", end: "18:30" },
  { name: "NY PM", start: "18:30", end: "22:00" },
] as const;
