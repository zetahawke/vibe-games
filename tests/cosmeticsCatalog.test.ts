import { describe, expect, it } from 'vitest';
import {
  COSMETIC_PRICES,
  LEGACY_OWNED_HATS,
  LEGACY_OWNED_PANTS,
  LEGACY_OWNED_SHIRTS,
} from '@/domain/cosmetics/catalog';

describe('cosmetics catalog', () => {
  it('prices match design', () => {
    expect(COSMETIC_PRICES.cap).toBe(10);
    expect(COSMETIC_PRICES.armor).toBe(20);
    expect(COSMETIC_PRICES.jersey_argentina).toBe(10);
    expect(COSMETIC_PRICES.hair_spiky).toBe(10);
  });

  it('legacy owned seeds include current free cosmetics', () => {
    expect(LEGACY_OWNED_HATS).toEqual(expect.arrayContaining(['none', 'cap']));
    expect(LEGACY_OWNED_SHIRTS).toEqual(expect.arrayContaining(['none', 'jersey', 'armor']));
    expect(LEGACY_OWNED_PANTS).toEqual(expect.arrayContaining(['none', 'shinguards']));
  });
});
