import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';
import { verifyAdminJwt } from './_verifyAdmin.js';
import { hashPin } from '../_pinHash.js';
import { migrateGrade, type ChileGrade } from '../_grade.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

const GRADES = new Set(['1ro', '2do', '3ro', '4to', '5to', '6to', '7mo', '8vo']);

export default async function handler(req: Req, res: Res): Promise<void> {
  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'admin/players', 30))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }
  if (!(await verifyAdminJwt(req.headers))) {
    res.status(403).json({ error: 'No autorizado.' }); return;
  }

  if (req.method === 'GET') {
    const { data, error } = await getAdmin()
      .from('players')
      .select('id, username, grade, avatar_sex, avatar_color, display_name, created_at, last_seen')
      .order('last_seen', { ascending: false })
      .limit(200);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(200).json({
      players: (data ?? []).map((p) => ({
        id: p.id,
        username: p.username,
        grade: migrateGrade(p.grade as string),
        sex: p.avatar_sex === 'girl' ? 'girl' : 'boy',
        color: p.avatar_color,
        displayName: p.display_name || p.username,
        createdAt: p.created_at,
        lastSeen: p.last_seen,
      })),
    });
    return;
  }

  if (req.method === 'PATCH') {
    const id = typeof req.body.id === 'string' ? req.body.id : '';
    if (!id) { res.status(400).json({ error: 'Falta id.' }); return; }
    const patch: Record<string, unknown> = { last_seen: new Date().toISOString() };
    if (typeof req.body.grade === 'string') {
      const grade = migrateGrade(req.body.grade) as ChileGrade;
      if (!GRADES.has(grade)) { res.status(400).json({ error: 'Grado inválido.' }); return; }
      patch.grade = grade;
    }
    if (typeof req.body.pin === 'string' && req.body.pin.trim().length >= 4) {
      patch.pin_hash = hashPin(req.body.pin.trim());
    }
    const { error } = await getAdmin().from('players').update(patch).eq('id', id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === 'DELETE') {
    const id = typeof req.body.id === 'string' ? req.body.id : (typeof req.query.id === 'string' ? req.query.id : '');
    if (!id) { res.status(400).json({ error: 'Falta id.' }); return; }
    await getAdmin().from('scoreboard_entries').delete().eq('player_id', id);
    await getAdmin().from('session_players').delete().eq('player_id', id);
    const { error } = await getAdmin().from('players').delete().eq('id', id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).end();
}
