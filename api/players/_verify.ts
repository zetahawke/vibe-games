import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'players/verify', 20))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const { username, sessionToken } = req.body as { username?: string; sessionToken?: string };
  if (!username || !sessionToken) {
    res.status(400).json({ error: 'Datos incompletos.' }); return;
  }

  const { data, error } = await getAdmin()
    .from('players')
    .select('id')
    .eq('username', username)
    .eq('session_token', sessionToken)
    .single();

  if (error || !data) { res.status(401).json({ error: 'Credenciales inválidas.' }); return; }

  await getAdmin()
    .from('players')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', data.id);

  res.status(200).json({ playerId: data.id });
}
