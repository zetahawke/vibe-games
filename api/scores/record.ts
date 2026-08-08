import { getAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'scores/record', 30))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const {
    sessionId, playerId, sessionToken,
    personalScore, coinsEarned, lastWeapon, subject, grade,
  } = req.body as {
    sessionId?: string; playerId?: string; sessionToken?: string;
    personalScore?: number; coinsEarned?: number; lastWeapon?: string;
    subject?: string; grade?: string;
  };

  if (!sessionId || !playerId || !sessionToken) {
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

  // Derive player count from session_players at time of recording.
  const { count: playerCount } = await getAdmin()
    .from('session_players')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  const { error } = await getAdmin().from('scoreboard_entries').insert({
    session_id:     sessionId,
    player_id:      playerId,
    player_count:   playerCount ?? 1,
    personal_score: personalScore ?? 0,
    session_score:  personalScore ?? 0,
    coins_earned:   coinsEarned ?? 0,
    coins_spent:    0,
    last_weapon:    lastWeapon ?? '',
    subject:        subject ?? '',
    grade:          grade ?? '',
  });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json({ ok: true });
}
