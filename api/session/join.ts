import { supabaseAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'session/join'))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const { playerId, sessionToken, code } = req.body as {
    playerId?: string; sessionToken?: string; code?: string;
  };
  if (!playerId || !sessionToken || !code) {
    res.status(400).json({ error: 'Datos incompletos.' }); return;
  }

  // Verify player identity.
  const { data: player } = await supabaseAdmin
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('session_token', sessionToken)
    .single();
  if (!player) { res.status(401).json({ error: 'Identidad no verificada.' }); return; }

  // Find open session.
  const { data: session, error: sessionErr } = await supabaseAdmin
    .from('game_sessions')
    .select('id')
    .eq('code', code)
    .eq('status', 'open')
    .single();
  if (sessionErr || !session) { res.status(404).json({ error: 'Sala no encontrada.' }); return; }

  // Count active players (left_at is null means still in session).
  const { count } = await supabaseAdmin
    .from('session_players')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', session.id)
    .is('left_at', null);
  if ((count ?? 0) >= 4) { res.status(409).json({ error: 'La sala está llena.' }); return; }

  // Add player to session.
  await supabaseAdmin
    .from('session_players')
    .insert({ session_id: session.id, player_id: playerId, is_host: false });

  res.status(200).json({ sessionId: session.id, playerCount: (count ?? 0) + 1 });
}
