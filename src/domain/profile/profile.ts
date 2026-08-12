import { STORAGE_PREFIX } from '@/config/gameConfig';
import {
  normalizeHatId,
  normalizePantsId,
  normalizeShirtId,
  type HatId,
  type PantsId,
  type ShirtId,
} from '@/assets/boxing/manifest';

export type ChileGrade = '1ro' | '2do' | '3ro' | '4to' | '5to' | '6to' | '7mo' | '8vo';
export type AvatarSex = 'boy' | 'girl';
export type { HatId, ShirtId, PantsId };
export { normalizeHatId, normalizeShirtId, normalizePantsId };

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

export function defaultProfile(displayName = ''): PlayerProfile {
  return {
    grade: PLAYABLE_GRADE,
    sex: 'boy',
    color: DEFAULT_AVATAR_COLOR,
    displayName,
    hatId: 'none',
    shirtId: 'none',
    pantsId: 'none',
  };
}

function profileKey(username: string): string {
  return `${STORAGE_PREFIX}profile:${username}`;
}

function normalizeColor(c: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(c) ? c.toLowerCase() : DEFAULT_AVATAR_COLOR;
}

function normalizeProfile(p: Partial<PlayerProfile>): PlayerProfile {
  return {
    grade: migrateGrade(p.grade as string),
    sex: p.sex === 'girl' ? 'girl' : 'boy',
    color: normalizeColor(typeof p.color === 'string' ? p.color : DEFAULT_AVATAR_COLOR),
    displayName: typeof p.displayName === 'string' ? p.displayName : '',
    hatId: normalizeHatId(p.hatId),
    shirtId: normalizeShirtId(p.shirtId),
    pantsId: normalizePantsId(p.pantsId),
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
}, fallbackName = ''): PlayerProfile {
  return {
    grade: migrateGrade(raw.grade),
    sex: raw.avatar_sex === 'girl' ? 'girl' : 'boy',
    color: normalizeColor(typeof raw.avatar_color === 'string' ? raw.avatar_color : DEFAULT_AVATAR_COLOR),
    displayName: typeof raw.display_name === 'string' && raw.display_name.trim()
      ? raw.display_name.trim()
      : fallbackName,
    hatId: normalizeHatId(raw.avatar_hat),
    shirtId: normalizeShirtId(raw.avatar_shirt),
    pantsId: normalizePantsId(raw.avatar_pants),
  };
}

export function requireProfile(username: string): PlayerProfile {
  return loadProfile(username) ?? defaultProfile();
}
