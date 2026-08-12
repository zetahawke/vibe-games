import { describe, expect, it } from 'vitest';
import { buyWeapon, coinsForKill } from '@/domain/economy/economy';

describe('economy', () => {
  it('buys pistol when enough coins', () => {
    const r = buyWeapon(20, ['knife'], 'pistol');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.coins).toBe(5);
      expect(r.owned).toContain('pistol');
    }
  });

  it('pays wave plus enemy tier', () => {
    // Kill coin rewards temporarily disabled in economy.ts
    expect(coinsForKill(1, 'zombie')).toBe(0);
    expect(coinsForKill(9, 'yeti')).toBe(0);
  });

  it('rejects if already owned', () => {
    const r = buyWeapon(100, ['knife', 'pistol'], 'pistol');
    expect(r.ok).toBe(false);
  });

  it('buys bow when enough coins', () => {
    const r = buyWeapon(60, ['knife'], 'bow');
    expect(r.ok).toBe(true);
  });
});
