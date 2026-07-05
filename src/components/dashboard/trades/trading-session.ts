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

function toUtcTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Resolves a trade's UTC time-of-day to a trading session. Sessions can
 * overlap (Asian/London, London/NY AM); iterating the config in its
 * already-chronological order and always overwriting the match on a hit
 * means the later-starting session wins. Returns null for the 22:00-24:00
 * gap, which intentionally has no session.
 */
export function getTradingSession(date: Date): TradingSession | null {
  const time = toUtcTime(date);
  let match: TradingSession | null = null;
  for (const session of tradingSessions) {
    if (time >= session.start && time < session.end) match = session;
  }
  return match;
}
