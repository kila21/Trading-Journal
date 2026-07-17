export const tradeTimeframes = ["1m", "2m", "3m", "5m", "15m", "1H", "4H", "Daily", "Weekly"] as const;

export type TradeTimeframe = (typeof tradeTimeframes)[number];
