import { randomUUID } from 'crypto';
import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';
import { hashPin } from '../_pinHash.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'players/register', 10))) {
    res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }); return;
  }

  const { username, pin } = req.body as { username?: string; pin?: string };
  if (!username || username.trim().length < 2 || username.trim().length > 20) {
    res.status(400).json({ error: 'Nombre de usuario inválido (2–20 caracteres).' }); return;
  }
  if (!pin || pin.trim().length < 4) {
    res.status(400).json({ error: 'PIN inválido.' }); return;
  }

  const sessionToken = randomUUID();
  const pin_hash = hashPin(pin.trim());

  const { data, error } = await getAdmin()
    .from('players')
    .insert({
      username: username.trim(),
      session_token: sessionToken,
      pin_hash,
      grade: '2do',
      avatar_sex: 'boy',
      avatar_color: '#2f6fed',
      display_name: username.trim(),
    })
    .select('id, grade, avatar_sex, avatar_color, display_name')
    .single();

  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Ese nombre ya está en uso.' }); return;
    }
    res.status(500).json({ error: error.message }); return;
  }

  res.status(200).json({
    playerId: data.id,
    sessionToken,
    grade: data.grade ?? '2do',
    avatar_sex: data.avatar_sex ?? 'boy',
    avatar_color: data.avatar_color ?? '#2f6fed',
    display_name: data.display_name ?? username.trim(),
  });
}
