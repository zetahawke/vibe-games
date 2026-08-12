import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';
import { migrateGrade } from '../_grade.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

const PROFILE_COLS = 'id, username, grade, avatar_sex, avatar_color, display_name, avatar_hat, avatar_shirt, avatar_pants';

const HAT = new Set(['none', 'cap']);
const SHIRT = new Set(['none', 'jersey', 'armor']);
const PANTS = new Set(['none', 'shinguards']);

function normOverlay(raw: unknown, allowed: Set<string>): string {
  const s = typeof raw === 'string' ? raw : 'none';
  return allowed.has(s) ? s : 'none';
}

function tokenOf(req: Req): string {
  const q = req.query['sessionToken'];
  if (typeof q === 'string') return q;
  const body = typeof req.body?.sessionToken === 'string' ? req.body.sessionToken : '';
  return body;
}

function serialize(row: {
  grade?: string;
  avatar_sex?: string;
  avatar_color?: string;
  display_name?: string | null;
  username?: string;
  avatar_hat?: string;
  avatar_shirt?: string;
  avatar_pants?: string;
}) {
  return {
    grade: migrateGrade(row.grade),
    avatar_sex: row.avatar_sex === 'girl' ? 'girl' : 'boy',
    avatar_color: typeof row.avatar_color === 'string' ? row.avatar_color : '#2f6fed',
    display_name: row.display_name || row.username || '',
    avatar_hat: normOverlay(row.avatar_hat, HAT),
    avatar_shirt: normOverlay(row.avatar_shirt, SHIRT),
    avatar_pants: normOverlay(row.avatar_pants, PANTS),
  };
}

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'PATCH') { res.status(405).end(); return; }

  const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? '0.0.0.0';
  if (!(await checkLimit(ip, 'players/profile', 40))) {
    res.status(429).json({ error: 'Demasiadas solicitudes.' }); return;
  }

  const sessionToken = tokenOf(req);
  if (!sessionToken) { res.status(400).json({ error: 'Datos incompletos.' }); return; }

  const { data: player, error } = await getAdmin()
    .from('players')
    .select(PROFILE_COLS)
    .eq('session_token', sessionToken)
    .single();

  if (error || !player) { res.status(401).json({ error: 'Credenciales inválidas.' }); return; }

  if (req.method === 'GET') {
    res.status(200).json(serialize(player));
    return;
  }

  const grade = typeof req.body.grade === 'string' ? migrateGrade(req.body.grade) : migrateGrade(player.grade);
  const sex = req.body.sex === 'girl' || req.body.avatar_sex === 'girl' ? 'girl' : 'boy';
  const color = typeof req.body.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(req.body.color)
    ? req.body.color.toLowerCase()
    : (typeof req.body.avatar_color === 'string' && /^#[0-9a-fA-F]{6}$/.test(req.body.avatar_color)
      ? req.body.avatar_color.toLowerCase()
      : (player.avatar_color || '#2f6fed'));
  const displayName = typeof req.body.displayName === 'string'
    ? req.body.displayName.trim().slice(0, 20)
    : (typeof req.body.display_name === 'string' ? req.body.display_name.trim().slice(0, 20) : player.display_name);
  const hat = normOverlay(req.body.hatId ?? req.body.avatar_hat ?? player.avatar_hat, HAT);
  const shirt = normOverlay(req.body.shirtId ?? req.body.avatar_shirt ?? player.avatar_shirt, SHIRT);
  const pants = normOverlay(req.body.pantsId ?? req.body.avatar_pants ?? player.avatar_pants, PANTS);

  const { data: updated, error: upErr } = await getAdmin()
    .from('players')
    .update({
      grade,
      avatar_sex: sex,
      avatar_color: color,
      display_name: displayName || player.username,
      avatar_hat: hat,
      avatar_shirt: shirt,
      avatar_pants: pants,
      last_seen: new Date().toISOString(),
    })
    .eq('id', player.id)
    .select(PROFILE_COLS)
    .single();

  if (upErr || !updated) { res.status(500).json({ error: upErr?.message ?? 'No se pudo guardar.' }); return; }
  res.status(200).json(serialize(updated));
}
