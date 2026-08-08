import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'session/close', 30))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const { sessionId, playerId, sessionToken } = req.body as {
    sessionId?: string; playerId?: string; sessionToken?: string;
  };
  if (!sessionId || !playerId || !sessionToken) {
    res.status(400).json({ error: 'Datos incompletos.' }); return;
  }

  // Verify player owns this identity AND is the host.
  const [{ data: player }, { data: hostEntry }] = await Promise.all([
    getAdmin()
      .from('players')
      .select('id')
      .eq('id', playerId)
      .eq('session_token', sessionToken)
      .single(),
    getAdmin()
      .from('session_players')
      .select('id')
      .eq('session_id', sessionId)
      .eq('player_id', playerId)
      .eq('is_host', true)
      .single(),
  ]);
  if (!player || !hostEntry) { res.status(403).json({ error: 'No autorizado.' }); return; }

  const now = new Date().toISOString();
  await getAdmin()
    .from('game_sessions')
    .update({ status: 'closed', closed_at: now })
    .eq('id', sessionId);

  await getAdmin()
    .from('session_players')
    .update({ left_at: now })
    .eq('session_id', sessionId)
    .is('left_at', null);

  res.status(200).json({ ok: true });
}
