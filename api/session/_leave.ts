import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'session/leave', 30))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const { sessionId, playerId, sessionToken } = req.body as {
    sessionId?: string; playerId?: string; sessionToken?: string;
  };
  if (!sessionId || !playerId || !sessionToken) {
    res.status(400).json({ error: 'Datos incompletos.' }); return;
  }

  const { data: player } = await getAdmin()
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('session_token', sessionToken)
    .single();
  if (!player) { res.status(401).json({ error: 'Identidad no verificada.' }); return; }

  await getAdmin()
    .from('session_players')
    .update({ left_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('player_id', playerId)
    .is('left_at', null);

  res.status(200).json({ ok: true });
}
