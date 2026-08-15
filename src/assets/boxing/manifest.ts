/** Maps a shop WeaponId to boxing piece catalog ids for each hand. */
export function weaponPieceIds(weaponId: string): { right: string; left?: string } {
  switch (weaponId) {
    case 'sword_shield':
      return { right: 'sword', left: 'shield' };
    case 'sword_shield_upgraded':
      return { right: 'sword_upgraded', left: 'shield_upgraded' };
    case 'bow':
      return { right: 'bow' };
    case 'bow_upgraded':
      return { right: 'bow_upgraded' };
    case 'longsword':
      return { right: 'longsword' };
    case 'longsword_upgraded':
      return { right: 'longsword_upgraded' };
    default:
      return { right: weaponId };
  }
}

export const HAT_IDS = ['none', 'cap', 'beanie'] as const;
export const SHIRT_IDS = ['none', 'jersey', 'armor', 'jersey_argentina'] as const;
export const PANTS_IDS = ['none', 'shinguards', 'shorts_football'] as const;
export const HAIR_IDS = ['none', 'hair_spiky'] as const;

export type HatId = (typeof HAT_IDS)[number];
export type ShirtId = (typeof SHIRT_IDS)[number];
export type PantsId = (typeof PANTS_IDS)[number];
export type HairId = (typeof HAIR_IDS)[number];

export function normalizeHatId(raw: unknown): HatId {
  return (HAT_IDS as readonly string[]).includes(String(raw)) ? (raw as HatId) : 'none';
}

export function normalizeShirtId(raw: unknown): ShirtId {
  return (SHIRT_IDS as readonly string[]).includes(String(raw)) ? (raw as ShirtId) : 'none';
}

export function normalizePantsId(raw: unknown): PantsId {
  return (PANTS_IDS as readonly string[]).includes(String(raw)) ? (raw as PantsId) : 'none';
}

export function normalizeHairId(raw: unknown): HairId {
  return (HAIR_IDS as readonly string[]).includes(String(raw)) ? (raw as HairId) : 'none';
}
