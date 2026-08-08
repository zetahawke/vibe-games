import { getAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';

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

  // Check for active season — no data shown if no season is running.
  const { data: season } = await getAdmin()
    .from('seasons')
    .select('name')
    .eq('is_active', true)
    .maybeSingle();

  if (!season) {
    res.status(200).json({ entries: [], seasonName: null }); return;
  }

  const { data, error } = await getAdmin()
    .from('scoreboard_entries')
    .select('personal_score, coins_earned, last_weapon, players(username)')
    .eq('player_count', playerCount)
    .order('personal_score', { ascending: false })
    .limit(20);

  if (error) { res.status(500).json({ error: error.message }); return; }

  const entries = (data ?? []).map((row) => ({
    username:      (row.players as { username: string } | null)?.username ?? 'Desconocido',
    personalScore: row.personal_score as number,
    coinsEarned:   row.coins_earned as number,
    lastWeapon:    row.last_weapon as string,
  }));

  res.status(200).json({ entries, seasonName: season.name });
}
