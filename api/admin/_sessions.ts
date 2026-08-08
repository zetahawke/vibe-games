import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';
import { verifyAdminJwt } from './_verifyAdmin.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

type PlayerJoin = { username: string } | { username: string }[] | null;
type SessionPlayerRow = {
  is_host: boolean;
  left_at: string | null;
  players: PlayerJoin;
};

function usernameOf(join: PlayerJoin): string {
  if (!join) return '?';
  if (Array.isArray(join)) return join[0]?.username ?? '?';
  return join.username ?? '?';
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'admin/sessions', 30))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }
  if (!(await verifyAdminJwt(req.headers))) {
    res.status(403).json({ error: 'No autorizado.' }); return;
  }

  if (req.method === 'GET') {
    const { data, error } = await getAdmin()
      .from('game_sessions')
      .select('id, code, status, created_at, session_players(is_host, left_at, players(username))')
      .in('status', ['open', 'active'])
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) { res.status(500).json({ error: error.message }); return; }

    const sessions = (data ?? []).map((row) => {
      const members = ((row.session_players ?? []) as SessionPlayerRow[]).filter((p) => !p.left_at);
      const host = members.find((p) => p.is_host);
      return {
        id: row.id,
        code: row.code,
        status: row.status,
        createdAt: row.created_at,
        host: host ? usernameOf(host.players) : '—',
        players: members.map((p) => usernameOf(p.players)),
      };
    });
    res.status(200).json({ sessions });
    return;
  }

  if (req.method === 'POST') {
    const sessionId = typeof req.body.sessionId === 'string' ? req.body.sessionId : '';
    if (!sessionId) { res.status(400).json({ error: 'Falta sessionId.' }); return; }
    const now = new Date().toISOString();
    const { error } = await getAdmin()
      .from('game_sessions')
      .update({ status: 'closed', closed_at: now })
      .eq('id', sessionId);
    if (error) { res.status(500).json({ error: error.message }); return; }
    await getAdmin()
      .from('session_players')
      .update({ left_at: now })
      .eq('session_id', sessionId)
      .is('left_at', null);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).end();
}
