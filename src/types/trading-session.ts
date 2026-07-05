import type { tradingSessions } from "@/config/trade-sessions";

export type TradingSession = (typeof tradingSessions)[number];
export type SessionName = TradingSession["name"];
