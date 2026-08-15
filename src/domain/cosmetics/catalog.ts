export type CosmeticSlot = 'hat' | 'shirt' | 'pants' | 'hair';

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

export const LEGACY_OWNED_HATS = ['none', 'cap'] as const;
export const LEGACY_OWNED_SHIRTS = ['none', 'jersey', 'armor'] as const;
export const LEGACY_OWNED_PANTS = ['none', 'shinguards'] as const;
export const LEGACY_OWNED_HAIRS = ['none'] as const;

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
