import { describe, expect, it } from 'vitest';
import {
  COSMETIC_PRICES,
  STARTER_OWNED_HATS,
  STARTER_OWNED_PANTS,
  STARTER_OWNED_SHIRTS,
} from '@/domain/cosmetics/catalog';

describe('cosmetics catalog', () => {
  it('prices all cosmetics including former free ones', () => {
    expect(COSMETIC_PRICES.cap).toBe(10);
    expect(COSMETIC_PRICES.jersey).toBe(10);
    expect(COSMETIC_PRICES.armor).toBe(20);
    expect(COSMETIC_PRICES.shinguards).toBe(10);
    expect(COSMETIC_PRICES.jersey_argentina).toBe(10);
    expect(COSMETIC_PRICES.hair_spiky).toBe(10);
  });

  it('starter inventory is only none', () => {
    expect(STARTER_OWNED_HATS).toEqual(['none']);
    expect(STARTER_OWNED_SHIRTS).toEqual(['none']);
    expect(STARTER_OWNED_PANTS).toEqual(['none']);
  });
});
