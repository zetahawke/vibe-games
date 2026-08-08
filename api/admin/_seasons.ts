import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';
import { verifyAdminJwt } from './_verifyAdmin.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'admin/seasons', 10))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  if (!(await verifyAdminJwt(req.headers))) {
    res.status(403).json({ error: 'No autorizado.' }); return;
  }

  const { action, name } = req.body as { action?: 'start' | 'end'; name?: string };

  if (action === 'start') {
    if (!name?.trim()) { res.status(400).json({ error: 'Nombre de temporada requerido.' }); return; }
    await getAdmin()
      .from('seasons')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('is_active', true);
    const { error } = await getAdmin()
      .from('seasons')
      .insert({ name: name.trim(), is_active: true });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(200).json({ ok: true }); return;
  }

  if (action === 'end') {
    await getAdmin()
      .from('seasons')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('is_active', true);
    res.status(200).json({ ok: true }); return;
  }

  res.status(400).json({ error: 'Acción desconocida.' });
}
