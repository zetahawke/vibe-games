import { getAdmin } from '../_supabase.js';
import { checkLimit } from '../_rateLimit.js';
import { migrateGrade } from '../_grade.js';

type Req = { method?: string; headers: Record<string, string | string[] | undefined>; body: Record<string, unknown>; query: Record<string, string | string[] | undefined> };
type Res = { status: (n: number) => Res; json: (b: unknown) => void; end: () => void };

const PROFILE_COLS = 'id, username, grade, avatar_sex, avatar_color, display_name, avatar_hat, avatar_shirt, avatar_pants, avatar_hair, gems, cosmetic_inventory';

const HAT = new Set(['none', 'cap', 'beanie']);
const SHIRT = new Set(['none', 'jersey', 'armor', 'jersey_argentina']);
const PANTS = new Set(['none', 'shinguards', 'shorts_football']);
const HAIR = new Set(['none', 'hair_spiky']);

function normOverlay(raw: unknown, allowed: Set<string>): string {
  const s = typeof raw === 'string' ? raw : 'none';
  return allowed.has(s) ? s : 'none';
}

function normOwned(raw: unknown, allowed: Set<string>, legacy: string[]): string[] {
  const base = Array.isArray(raw) ? raw.map(String) : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of [...legacy, ...base]) {
    if (!allowed.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  if (!seen.has('none')) out.unshift('none');
  return out;
}

function inventoryOf(row: { cosmetic_inventory?: unknown; ownedHats?: unknown; ownedShirts?: unknown; ownedPants?: unknown; ownedHairs?: unknown }) {
  const inv = (row.cosmetic_inventory && typeof row.cosmetic_inventory === 'object')
    ? row.cosmetic_inventory as Record<string, unknown>
    : {};
  return {
    hats: normOwned(row.ownedHats ?? inv.hats, HAT, ['none', 'cap']),
    shirts: normOwned(row.ownedShirts ?? inv.shirts, SHIRT, ['none', 'jersey', 'armor']),
    pants: normOwned(row.ownedPants ?? inv.pants, PANTS, ['none', 'shinguards']),
    hairs: normOwned(row.ownedHairs ?? inv.hairs, HAIR, ['none']),
  };
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
  avatar_hair?: string;
  gems?: number;
  cosmetic_inventory?: unknown;
}) {
  const inv = inventoryOf(row);
  let hat = normOverlay(row.avatar_hat, HAT);
  let shirt = normOverlay(row.avatar_shirt, SHIRT);
  let pants = normOverlay(row.avatar_pants, PANTS);
  let hair = normOverlay(row.avatar_hair, HAIR);
  if (!inv.hats.includes(hat)) hat = 'none';
  if (!inv.shirts.includes(shirt)) shirt = 'none';
  if (!inv.pants.includes(pants)) pants = 'none';
  if (!inv.hairs.includes(hair)) hair = 'none';
  return {
    grade: migrateGrade(row.grade),
    avatar_sex: row.avatar_sex === 'girl' ? 'girl' : 'boy',
    avatar_color: typeof row.avatar_color === 'string' ? row.avatar_color : '#2f6fed',
    display_name: row.display_name || row.username || '',
    avatar_hat: hat,
    avatar_shirt: shirt,
    avatar_pants: pants,
    avatar_hair: hair,
    gems: Number.isFinite(row.gems) ? Math.max(0, Math.floor(Number(row.gems))) : 0,
    cosmetic_inventory: inv,
    ownedHats: inv.hats,
    ownedShirts: inv.shirts,
    ownedPants: inv.pants,
    ownedHairs: inv.hairs,
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

  const inv = inventoryOf({
    cosmetic_inventory: req.body.cosmetic_inventory ?? player.cosmetic_inventory,
    ownedHats: req.body.ownedHats,
    ownedShirts: req.body.ownedShirts,
    ownedPants: req.body.ownedPants,
    ownedHairs: req.body.ownedHairs,
  });

  let hat = normOverlay(req.body.hatId ?? req.body.avatar_hat ?? player.avatar_hat, HAT);
  let shirt = normOverlay(req.body.shirtId ?? req.body.avatar_shirt ?? player.avatar_shirt, SHIRT);
  let pants = normOverlay(req.body.pantsId ?? req.body.avatar_pants ?? player.avatar_pants, PANTS);
  let hair = normOverlay(req.body.hairId ?? req.body.avatar_hair ?? player.avatar_hair, HAIR);
  if (!inv.hats.includes(hat)) hat = 'none';
  if (!inv.shirts.includes(shirt)) shirt = 'none';
  if (!inv.pants.includes(pants)) pants = 'none';
  if (!inv.hairs.includes(hair)) hair = 'none';

  const gemsRaw = req.body.gems ?? player.gems;
  const gems = Number.isFinite(Number(gemsRaw)) ? Math.max(0, Math.floor(Number(gemsRaw))) : 0;

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
      avatar_hair: hair,
      gems,
      cosmetic_inventory: inv,
      last_seen: new Date().toISOString(),
    })
    .eq('id', player.id)
    .select(PROFILE_COLS)
    .single();

  if (upErr || !updated) { res.status(500).json({ error: upErr?.message ?? 'No se pudo guardar.' }); return; }
  res.status(200).json(serialize(updated));
}
