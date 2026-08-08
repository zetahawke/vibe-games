import { getAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';
import { verifyAdminJwt } from './_verifyAdmin';

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

  const { data, error } = await getAdmin()
    .from('scoreboard_entries')
    .select('personal_score, players(username)')
    .order('personal_score', { ascending: false })
    .limit(limit);

  if (error) { res.status(500).json({ error: error.message }); return; }

  const players = (data ?? []).map((row) => ({
    username:   (row.players as { username: string } | null)?.username ?? 'Desconocido',
    totalScore: row.personal_score as number,
  }));

  res.status(200).json({ players });
}
