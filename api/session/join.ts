import { getAdmin } from '../_supabase';
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
  const normalized = String(code ?? '').replace(/\D/g, '').padStart(4, '0').slice(-4);
  if (!playerId || !sessionToken || normalized.length !== 4) {
    res.status(400).json({ error: 'Datos incompletos.' }); return;
  }

  // Verify player identity.
  const { data: player } = await getAdmin()
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('session_token', sessionToken)
    .single();
  if (!player) { res.status(401).json({ error: 'Identidad no verificada.' }); return; }

  // Find open session. char(4) may come back padded.
  const { data: session, error: sessionErr } = await getAdmin()
    .from('game_sessions')
    .select('id, code')
    .eq('code', normalized)
    .eq('status', 'open')
    .maybeSingle();
  if (sessionErr || !session) { res.status(404).json({ error: 'Sala no encontrada.' }); return; }

  const roomCode = String(session.code).trim();

  const { data: existing } = await getAdmin()
    .from('session_players')
    .select('id, left_at, is_host')
    .eq('session_id', session.id)
    .eq('player_id', playerId)
    .maybeSingle();

  if (existing?.is_host && !existing.left_at) {
    res.status(409).json({
      error: 'Ese jugador ya es el anfitrión. En la otra ventana usá otra cuenta.',
    });
    return;
  }

  if (existing?.left_at) {
    await getAdmin()
      .from('session_players')
      .update({ left_at: null })
      .eq('id', existing.id);
  } else if (!existing) {
    const { count } = await getAdmin()
      .from('session_players')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id)
      .is('left_at', null);
    if ((count ?? 0) >= 4) { res.status(409).json({ error: 'La sala está llena.' }); return; }

    const { error: insErr } = await getAdmin()
      .from('session_players')
      .insert({ session_id: session.id, player_id: playerId, is_host: false });
    if (insErr && insErr.code !== '23505') {
      res.status(500).json({ error: insErr.message }); return;
    }
  }

  const { count: playerCount } = await getAdmin()
    .from('session_players')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', session.id)
    .is('left_at', null);

  res.status(200).json({ sessionId: session.id, playerCount: playerCount ?? 1, code: roomCode });
}
