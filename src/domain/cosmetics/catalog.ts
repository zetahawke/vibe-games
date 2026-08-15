export type CosmeticSlot = 'hat' | 'shirt' | 'pants' | 'hair';

/** All equippable cosmetics cost gems; only `none` is free / starter. */
export const COSMETIC_PRICES: Record<string, number> = {
  cap: 10,
  beanie: 10,
  jersey: 10,
  armor: 20,
  jersey_argentina: 10,
  shinguards: 10,
  shorts_football: 10,
  hair_spiky: 10,
};

/** Starter inventory — nothing pre-owned except empty slot. */
export const STARTER_OWNED_HATS = ['none'] as const;
export const STARTER_OWNED_SHIRTS = ['none'] as const;
export const STARTER_OWNED_PANTS = ['none'] as const;
export const STARTER_OWNED_HAIRS = ['none'] as const;

/** @deprecated use STARTER_OWNED_* */
export const LEGACY_OWNED_HATS = STARTER_OWNED_HATS;
export const LEGACY_OWNED_SHIRTS = STARTER_OWNED_SHIRTS;
export const LEGACY_OWNED_PANTS = STARTER_OWNED_PANTS;
export const LEGACY_OWNED_HAIRS = STARTER_OWNED_HAIRS;

/**
 * Items previously granted free; stripped on load so players must buy them.
 * Paid-only cosmetics (beanie, jersey_argentina, …) are kept if already owned.
 */
export const REVOKED_COMPLIMENTARY = new Set([
  'cap',
  'jersey',
  'armor',
  'shinguards',
]);

export const COSMETIC_LABELS: Record<string, string> = {
  none: 'Ninguno',
  cap: 'Gorra',
  beanie: 'Gorro',
  jersey: 'Camiseta',
  armor: 'Armadura',
  jersey_argentina: 'Camiseta Argentina',
  shinguards: 'Canilleras',
  shorts_football: 'Shorts de fútbol',
  hair_spiky: 'Peinado punta',
};

export function cosmeticLabel(id: string): string {
  return COSMETIC_LABELS[id] ?? id;
}

export function cosmeticPrice(id: string): number {
  return COSMETIC_PRICES[id] ?? 0;
}
