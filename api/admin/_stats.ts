import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';
import { embeddedUsername } from '../_scores.js';
import { verifyAdminJwt } from './_verifyAdmin.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'GET') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'admin/stats', 20))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  if (!(await verifyAdminJwt(req.headers))) {
    res.status(403).json({ error: 'No autorizado.' }); return;
  }

  const limit = Math.min(Number(req.query['limit'] ?? 10), 100);

  const [{ data: season }, { data: rows, error }] = await Promise.all([
    getAdmin().from('seasons').select('id, name, is_active, started_at, ended_at').eq('is_active', true).maybeSingle(),
    getAdmin().from('scoreboard_entries').select('personal_score, player_id, season_id, players(username)'),
  ]);

  if (error) { res.status(500).json({ error: error.message }); return; }

  const byPlayer = new Map<string, {
    username: string;
    totalScore: number;
    matches: number;
    bestScore: number;
  }>();

  for (const row of rows ?? []) {
    if (season?.id && row.season_id && row.season_id !== season.id) continue;
    const username = embeddedUsername(row.players);
    const score = Number(row.personal_score) || 0;
    const prev = byPlayer.get(row.player_id as string);
    if (!prev) {
      byPlayer.set(row.player_id as string, {
        username,
        totalScore: score,
        matches: 1,
        bestScore: score,
      });
      continue;
    }
    prev.totalScore += score;
    prev.matches += 1;
    prev.bestScore = Math.max(prev.bestScore, score);
  }

  const players = [...byPlayer.values()]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);

  res.status(200).json({
    season: season
      ? { id: season.id, name: season.name, isActive: season.is_active, startedAt: season.started_at }
      : null,
    players,
  });
}
