import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

const MAX_SESSIONS = 6;

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'session/create'))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const { playerId, sessionToken } = req.body as { playerId?: string; sessionToken?: string };
  if (!playerId || !sessionToken) { res.status(400).json({ error: 'Datos incompletos.' }); return; }

  // Verify player identity.
  const { data: player, error: playerErr } = await getAdmin()
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('session_token', sessionToken)
    .single();
  if (playerErr || !player) { res.status(401).json({ error: 'Identidad no verificada.' }); return; }

  // Close leftover open rooms hosted by this player so the 6-room cap stays usable.
  const { data: hosted } = await getAdmin()
    .from('session_players')
    .select('session_id')
    .eq('player_id', playerId)
    .eq('is_host', true)
    .is('left_at', null);
  if (hosted?.length) {
    const ids = hosted.map((h) => h.session_id);
    const now = new Date().toISOString();
    await getAdmin().from('game_sessions').update({ status: 'closed', closed_at: now }).in('id', ids).eq('status', 'open');
    await getAdmin().from('session_players').update({ left_at: now }).in('session_id', ids).is('left_at', null);
  }

  // Enforce session cap.
  const { count, error: countErr } = await getAdmin()
    .from('game_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');
  if (countErr) { res.status(500).json({ error: countErr.message }); return; }
  if ((count ?? 0) >= MAX_SESSIONS) {
    res.status(409).json({ error: 'No hay sala disponible. Intenta más tarde.' }); return;
  }

  // Generate a unique 4-digit code.
  let code = generateCode();
  for (let i = 0; i < 10; i++) {
    const { data: existing } = await getAdmin()
      .from('game_sessions')
      .select('id')
      .eq('code', code)
      .eq('status', 'open')
      .maybeSingle();
    if (!existing) break;
    code = generateCode();
  }

  // Insert session.
  const { data: session, error: insertErr } = await getAdmin()
    .from('game_sessions')
    .insert({ code, status: 'open' })
    .select('id')
    .single();
  if (insertErr || !session) { res.status(500).json({ error: 'Error creando sala.' }); return; }

  // Record host in session_players.
  await getAdmin()
    .from('session_players')
    .insert({ session_id: session.id, player_id: playerId, is_host: true });

  res.status(200).json({ sessionId: session.id, code });
}
