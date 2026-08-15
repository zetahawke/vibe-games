import { STORAGE_PREFIX } from '@/config/gameConfig';
import {
  LEGACY_OWNED_HAIRS,
  LEGACY_OWNED_HATS,
  LEGACY_OWNED_PANTS,
  LEGACY_OWNED_SHIRTS,
  cosmeticPrice,
  type CosmeticSlot,
} from '@/domain/cosmetics/catalog';
import {
  normalizeHairId,
  normalizeHatId,
  normalizePantsId,
  normalizeShirtId,
  type HairId,
  type HatId,
  type PantsId,
  type ShirtId,
} from '@/assets/boxing/manifest';

export type ChileGrade = '1ro' | '2do' | '3ro' | '4to' | '5to' | '6to' | '7mo' | '8vo';
export type AvatarSex = 'boy' | 'girl';
export type { HatId, ShirtId, PantsId, HairId };
export { normalizeHatId, normalizeShirtId, normalizePantsId, normalizeHairId };

export interface GradeOption {
  id: ChileGrade;
  label: string;
  enabled: boolean;
}

export interface PlayerProfile {
  grade: ChileGrade;
  sex: AvatarSex;
  color: string;
  displayName: string;
  hatId: HatId;
  shirtId: ShirtId;
  pantsId: PantsId;
  hairId: HairId;
  gems: number;
  ownedHats: HatId[];
  ownedShirts: ShirtId[];
  ownedPants: PantsId[];
  ownedHairs: HairId[];
}

export const AVATAR_COLORS = [
  '#2f6fed', '#c94c4c', '#3f8f5b', '#c97a2a',
  '#7b4fc4', '#2aa8a0', '#e8e8e8', '#2a2a2a',
] as const;

export const PLAYABLE_GRADE: ChileGrade = '2do';
export const DEFAULT_AVATAR_COLOR = '#2f6fed';

export const CHILE_GRADES: GradeOption[] = [
  { id: '1ro', label: '1ro Básico', enabled: false },
  { id: '2do', label: '2do Básico', enabled: true },
  { id: '3ro', label: '3ro Básico', enabled: false },
  { id: '4to', label: '4to Básico', enabled: false },
  { id: '5to', label: '5to Básico', enabled: false },
  { id: '6to', label: '6to Básico', enabled: false },
  { id: '7mo', label: '7mo Básico', enabled: false },
  { id: '8vo', label: '8vo Básico', enabled: false },
];

export function gradeLabel(id: ChileGrade): string {
  return CHILE_GRADES.find((g) => g.id === id)?.label ?? id;
}

export function isPlayableGrade(id: ChileGrade): boolean {
  return id === PLAYABLE_GRADE;
}

export function migrateGrade(raw: string | undefined | null): ChileGrade {
  const g = String(raw ?? '');
  const map: Record<string, ChileGrade> = {
    '5th': '5to', '6th': '6to', '7th': '2do', '8th': '8vo',
    '5to': '5to', '6to': '6to', '7mo': '2do', '8vo': '8vo',
    '1ro': '1ro', '2do': '2do', '3ro': '3ro', '4to': '4to',
  };
  return map[g] ?? PLAYABLE_GRADE;
}

function uniqueOwned<T extends string>(ids: readonly T[], normalize: (raw: unknown) => T): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const n = normalize(id);
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  if (!seen.has('none' as T)) out.unshift('none' as T);
  return out;
}

export function defaultProfile(displayName = ''): PlayerProfile {
  return {
    grade: PLAYABLE_GRADE,
    sex: 'boy',
    color: DEFAULT_AVATAR_COLOR,
    displayName,
    hatId: 'none',
    shirtId: 'none',
    pantsId: 'none',
    hairId: 'none',
    gems: 0,
    ownedHats: [...LEGACY_OWNED_HATS],
    ownedShirts: [...LEGACY_OWNED_SHIRTS],
    ownedPants: [...LEGACY_OWNED_PANTS],
    ownedHairs: [...LEGACY_OWNED_HAIRS],
  };
}

function profileKey(username: string): string {
  return `${STORAGE_PREFIX}profile:${username}`;
}

function normalizeColor(c: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(c) ? c.toLowerCase() : DEFAULT_AVATAR_COLOR;
}

function ownedList<T extends string>(
  raw: unknown,
  legacy: readonly T[],
  normalize: (raw: unknown) => T,
): T[] {
  if (!Array.isArray(raw)) return uniqueOwned(legacy, normalize);
  return uniqueOwned([...legacy, ...(raw as T[])], normalize);
}

export function normalizeProfile(p: Partial<PlayerProfile> & {
  cosmetic_inventory?: {
    hats?: unknown;
    shirts?: unknown;
    pants?: unknown;
    hairs?: unknown;
  };
}): PlayerProfile {
  const inv = p.cosmetic_inventory;
  const ownedHats = ownedList(p.ownedHats ?? inv?.hats, LEGACY_OWNED_HATS, normalizeHatId);
  const ownedShirts = ownedList(p.ownedShirts ?? inv?.shirts, LEGACY_OWNED_SHIRTS, normalizeShirtId);
  const ownedPants = ownedList(p.ownedPants ?? inv?.pants, LEGACY_OWNED_PANTS, normalizePantsId);
  const ownedHairs = ownedList(p.ownedHairs ?? inv?.hairs, LEGACY_OWNED_HAIRS, normalizeHairId);

  let hatId = normalizeHatId(p.hatId);
  let shirtId = normalizeShirtId(p.shirtId);
  let pantsId = normalizePantsId(p.pantsId);
  let hairId = normalizeHairId(p.hairId);
  if (!ownedHats.includes(hatId)) hatId = 'none';
  if (!ownedShirts.includes(shirtId)) shirtId = 'none';
  if (!ownedPants.includes(pantsId)) pantsId = 'none';
  if (!ownedHairs.includes(hairId)) hairId = 'none';

  const gems = Number.isFinite(p.gems) ? Math.max(0, Math.floor(p.gems as number)) : 0;

  return {
    grade: migrateGrade(p.grade as string),
    sex: p.sex === 'girl' ? 'girl' : 'boy',
    color: normalizeColor(typeof p.color === 'string' ? p.color : DEFAULT_AVATAR_COLOR),
    displayName: typeof p.displayName === 'string' ? p.displayName : '',
    hatId,
    shirtId,
    pantsId,
    hairId,
    gems,
    ownedHats,
    ownedShirts,
    ownedPants,
    ownedHairs,
  };
}

export function loadProfile(username: string): PlayerProfile | null {
  const raw = localStorage.getItem(profileKey(username));
  if (!raw) return null;
  try {
    return normalizeProfile(JSON.parse(raw) as Partial<PlayerProfile>);
  } catch {
    return null;
  }
}

export function saveProfile(username: string, profile: PlayerProfile): void {
  const n = normalizeProfile(profile);
  localStorage.setItem(profileKey(username), JSON.stringify({
    grade: n.grade,
    sex: n.sex,
    color: n.color,
    displayName: n.displayName.trim(),
    hatId: n.hatId,
    shirtId: n.shirtId,
    pantsId: n.pantsId,
    hairId: n.hairId,
    gems: n.gems,
    ownedHats: n.ownedHats,
    ownedShirts: n.ownedShirts,
    ownedPants: n.ownedPants,
    ownedHairs: n.ownedHairs,
  }));
}

export function profileFromApi(raw: {
  grade?: string;
  avatar_sex?: string;
  avatar_color?: string;
  display_name?: string;
  avatar_hat?: string;
  avatar_shirt?: string;
  avatar_pants?: string;
  avatar_hair?: string;
  gems?: number;
  cosmetic_inventory?: {
    hats?: unknown;
    shirts?: unknown;
    pants?: unknown;
    hairs?: unknown;
  };
  ownedHats?: unknown;
  ownedShirts?: unknown;
  ownedPants?: unknown;
  ownedHairs?: unknown;
}, fallbackName = ''): PlayerProfile {
  return normalizeProfile({
    grade: migrateGrade(raw.grade),
    sex: raw.avatar_sex === 'girl' ? 'girl' : 'boy',
    color: typeof raw.avatar_color === 'string' ? raw.avatar_color : DEFAULT_AVATAR_COLOR,
    displayName: typeof raw.display_name === 'string' && raw.display_name.trim()
      ? raw.display_name.trim()
      : fallbackName,
    hatId: normalizeHatId(raw.avatar_hat),
    shirtId: normalizeShirtId(raw.avatar_shirt),
    pantsId: normalizePantsId(raw.avatar_pants),
    hairId: normalizeHairId(raw.avatar_hair),
    gems: raw.gems,
    ownedHats: raw.ownedHats as HatId[] | undefined,
    ownedShirts: raw.ownedShirts as ShirtId[] | undefined,
    ownedPants: raw.ownedPants as PantsId[] | undefined,
    ownedHairs: raw.ownedHairs as HairId[] | undefined,
    cosmetic_inventory: raw.cosmetic_inventory,
  });
}

export function requireProfile(username: string): PlayerProfile {
  return loadProfile(username) ?? defaultProfile();
}

export function ownsCosmetic(profile: PlayerProfile, slot: CosmeticSlot, id: string): boolean {
  if (slot === 'hat') return profile.ownedHats.includes(normalizeHatId(id));
  if (slot === 'shirt') return profile.ownedShirts.includes(normalizeShirtId(id));
  if (slot === 'pants') return profile.ownedPants.includes(normalizePantsId(id));
  return profile.ownedHairs.includes(normalizeHairId(id));
}

export function tryBuyCosmetic(
  profile: PlayerProfile,
  slot: CosmeticSlot,
  id: string,
): { ok: true; profile: PlayerProfile } | { ok: false; reason: 'owned' | 'funds' | 'unknown' } {
  if (slot === 'hat') {
    const hid = normalizeHatId(id);
    if (hid === 'none' && id !== 'none') return { ok: false, reason: 'unknown' };
    if (hid === 'none' || profile.ownedHats.includes(hid)) return { ok: false, reason: 'owned' };
    const cost = cosmeticPrice(hid);
    if (cost <= 0) return { ok: false, reason: 'unknown' };
    if (profile.gems < cost) return { ok: false, reason: 'funds' };
    return {
      ok: true,
      profile: normalizeProfile({
        ...profile,
        gems: profile.gems - cost,
        ownedHats: [...profile.ownedHats, hid],
        hatId: hid,
      }),
    };
  }
  if (slot === 'shirt') {
    const sid = normalizeShirtId(id);
    if (sid === 'none' && id !== 'none') return { ok: false, reason: 'unknown' };
    if (sid === 'none' || profile.ownedShirts.includes(sid)) return { ok: false, reason: 'owned' };
    const cost = cosmeticPrice(sid);
    if (cost <= 0) return { ok: false, reason: 'unknown' };
    if (profile.gems < cost) return { ok: false, reason: 'funds' };
    return {
      ok: true,
      profile: normalizeProfile({
        ...profile,
        gems: profile.gems - cost,
        ownedShirts: [...profile.ownedShirts, sid],
        shirtId: sid,
      }),
    };
  }
  if (slot === 'pants') {
    const pid = normalizePantsId(id);
    if (pid === 'none' && id !== 'none') return { ok: false, reason: 'unknown' };
    if (pid === 'none' || profile.ownedPants.includes(pid)) return { ok: false, reason: 'owned' };
    const cost = cosmeticPrice(pid);
    if (cost <= 0) return { ok: false, reason: 'unknown' };
    if (profile.gems < cost) return { ok: false, reason: 'funds' };
    return {
      ok: true,
      profile: normalizeProfile({
        ...profile,
        gems: profile.gems - cost,
        ownedPants: [...profile.ownedPants, pid],
        pantsId: pid,
      }),
    };
  }
  const hair = normalizeHairId(id);
  if (hair === 'none' && id !== 'none') return { ok: false, reason: 'unknown' };
  if (hair === 'none' || profile.ownedHairs.includes(hair)) return { ok: false, reason: 'owned' };
  const cost = cosmeticPrice(hair);
  if (cost <= 0) return { ok: false, reason: 'unknown' };
  if (profile.gems < cost) return { ok: false, reason: 'funds' };
  return {
    ok: true,
    profile: normalizeProfile({
      ...profile,
      gems: profile.gems - cost,
      ownedHairs: [...profile.ownedHairs, hair],
      hairId: hair,
    }),
  };
}

export function addGems(profile: PlayerProfile, amount: number): PlayerProfile {
  const n = Math.max(0, Math.floor(amount));
  if (n <= 0) return profile;
  return normalizeProfile({ ...profile, gems: profile.gems + n });
}
