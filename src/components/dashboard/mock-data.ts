/**
 * Temporary stand-in for real Trade data. There is no Trade model yet (see
 * CLAUDE.md's data-layer section) — this generates deterministic, fake daily
 * stats for a given month so the dashboard UI has something to render. Delete
 * this file and replace its call sites with a real query once Trade exists.
 */
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DailyStats {
  pnl: number;
  trades: number;
  wins: number;
}

export function getMockDailyStats(year: number, month: number): Map<number, DailyStats> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const random = mulberry32(year * 100 + month);
  const stats = new Map<number, DailyStats>();

  for (let day = 1; day <= daysInMonth; day++) {
    if (random() < 0.55) continue;

    const trades = 1 + Math.floor(random() * 4);
    let pnl = 0;
    let wins = 0;

    for (let i = 0; i < trades; i++) {
      const isWin = random() < 0.55;
      const amount = Math.round((random() * 300 + 40) * (isWin ? 1 : -1));
      pnl += amount;
      if (isWin) wins++;
    }

    stats.set(day, { pnl, trades, wins });
  }

  return stats;
}
