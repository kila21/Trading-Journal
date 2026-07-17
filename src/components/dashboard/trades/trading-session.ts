// Resolves which market trading session (Asian/London/NY) a trade's timestamp falls into.
import { tradingSessions } from "@/config/trade-sessions";
import type { TradingSession, SessionName } from "@/types/trading-session";

export const sessionTranslationKeys: Record<SessionName, string> = {
  Asian: "sessionAsian",
  London: "sessionLondon",
  "NY AM": "sessionNyAm",
  "NY Lunch": "sessionNyLunch",
  "NY PM": "sessionNyPm",
};

const nyTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * Converts an absolute instant to its America/New_York wall-clock time
 * (HH:MM). Sessions are trader-timezone-agnostic by definition (a trade
 * opened in Rustavi at midnight local time is still an NY-afternoon trade),
 * so resolution always goes through actual NY local time rather than a fixed
 * UTC offset — Intl's timeZone conversion accounts for EDT/EST automatically,
 * unlike a hardcoded UTC-4/UTC-5 offset would.
 */
function toNyTime(date: Date): string {
  const parts = nyTimeFormatter.formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")!.value;
  const minute = parts.find((part) => part.type === "minute")!.value;
  return `${hour}:${minute}`;
}

function isWithinSession(time: string, session: TradingSession): boolean {
  return session.start < session.end
    ? time >= session.start && time < session.end
    : time >= session.start || time < session.end; // wraps past midnight (Asian)
}

/**
 * Resolves a trade's NY local time-of-day to a Kill Zone session. The five
 * windows are narrow and don't overlap or cover the full day — most trades
 * fall outside all of them, and this correctly returns null in that case
 * rather than forcing a nearest-session guess.
 */
export function getTradingSession(date: Date): TradingSession | null {
  const time = toNyTime(date);
  let match: TradingSession | null = null;
  for (const session of tradingSessions) {
    if (isWithinSession(time, session)) match = session;
  }
  return match;
}
