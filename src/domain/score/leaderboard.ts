export interface ScoreRow {
  username: string;
  personalScore: number;
  coinsEarned: number;
  lastWeapon: string;
}

/** One row per player: their best personal score, ranked high to low. */
export function bestEntriesPerPlayer(rows: ScoreRow[], limit = 20): ScoreRow[] {
  const best = new Map<string, ScoreRow>();
  for (const row of rows) {
    const prev = best.get(row.username);
    if (!prev || row.personalScore > prev.personalScore) best.set(row.username, row);
  }
  return [...best.values()]
    .sort((a, b) => b.personalScore - a.personalScore)
    .slice(0, limit);
}
