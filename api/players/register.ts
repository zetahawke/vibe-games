import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../_supabase';
import { checkLimit } from '../_rateLimit';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'players/register', 10))) {
    res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }); return;
  }

  const { username } = req.body as { username?: string };
  if (!username || username.trim().length < 2 || username.trim().length > 20) {
    res.status(400).json({ error: 'Nombre de usuario inválido (2–20 caracteres).' }); return;
  }

  const sessionToken = randomUUID();

  const { data, error } = await supabaseAdmin
    .from('players')
    .insert({ username: username.trim(), session_token: sessionToken })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'Ese nombre ya está en uso.' }); return;
    }
    res.status(500).json({ error: error.message }); return;
  }

  res.status(200).json({ playerId: data.id, sessionToken });
}
