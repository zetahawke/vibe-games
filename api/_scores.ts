export interface ScoreRow {
  username: string;
  personalScore: number;
  coinsEarned: number;
  lastWeapon: string;
}

export function embeddedUsername(players: unknown): string {
  const row = Array.isArray(players) ? players[0] : players;
  if (row && typeof row === 'object' && 'username' in row) {
    const username = (row as { username?: unknown }).username;
    if (typeof username === 'string' && username) return username;
  }
  return 'Desconocido';
}

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
