import { randomUUID } from 'crypto';
import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';
import { hashPin } from '../_pinHash.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'players/recover', 5))) {
    res.status(429).json({ error: 'Demasiados intentos. Esperá un momento.' }); return;
  }

  const { username, pin } = req.body as { username?: string; pin?: string };
  if (!username || !pin || pin.trim().length < 4) {
    res.status(400).json({ error: 'Datos incompletos.' }); return;
  }

  const { data, error } = await getAdmin()
    .from('players')
    .select('id, grade, avatar_sex, avatar_color, display_name')
    .eq('username', username.trim())
    .eq('pin_hash', hashPin(pin.trim()))
    .single();

  if (error || !data) {
    res.status(401).json({ error: 'Usuario o PIN incorrectos.' }); return;
  }

  const sessionToken = randomUUID();
  await getAdmin()
    .from('players')
    .update({ session_token: sessionToken, last_seen: new Date().toISOString() })
    .eq('id', data.id);

  res.status(200).json({
    playerId: data.id,
    sessionToken,
    grade: data.grade ?? '2do',
    avatar_sex: data.avatar_sex ?? 'boy',
    avatar_color: data.avatar_color ?? '#2f6fed',
    display_name: data.display_name ?? username.trim(),
  });
}
