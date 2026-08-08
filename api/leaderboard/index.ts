import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';
import { bestEntriesPerPlayer, embeddedUsername } from '../_scores.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'GET') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'leaderboard', 60))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const playerCount = Number(req.query['playerCount'] ?? 1);
  if (![1, 2, 3, 4].includes(playerCount)) {
    res.status(400).json({ error: 'playerCount debe ser 1–4.' }); return;
  }

  const { data: season } = await getAdmin()
    .from('seasons')
    .select('id, name')
    .eq('is_active', true)
    .maybeSingle();

  if (!season) {
    res.status(200).json({ entries: [], seasonName: null }); return;
  }

  // Entries often have season_id null (record API didn't stamp it historically).
  // Show current-season rows plus unstamped ones; exclude other seasons.
  const { data, error } = await getAdmin()
    .from('scoreboard_entries')
    .select('personal_score, coins_earned, last_weapon, season_id, players(username)')
    .eq('player_count', playerCount)
    .or(`season_id.eq.${season.id},season_id.is.null`);

  if (error) { res.status(500).json({ error: error.message }); return; }

  const rows = (data ?? []).map((row) => ({
    username:      embeddedUsername(row.players),
    personalScore: Number(row.personal_score) || 0,
    coinsEarned:   Number(row.coins_earned) || 0,
    lastWeapon:    String(row.last_weapon ?? 'knife'),
  }));

  res.status(200).json({
    entries: bestEntriesPerPlayer(rows, 20),
    seasonName: season.name,
  });
}
