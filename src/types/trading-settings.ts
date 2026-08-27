// Shape of a user's trading settings as returned by /api/trading-settings.
// null when the user hasn't set anything yet — no row exists until the first save.
export interface TradingSettingsDTO {
  accountBalance: number | null;
}
