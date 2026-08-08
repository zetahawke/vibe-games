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
    expect(coinsForKill(1, 'zombie')).toBe(2);
    expect(coinsForKill(9, 'yeti')).toBe(13);
  });

  it('rejects if already owned', () => {
    const r = buyWeapon(100, ['knife', 'pistol'], 'pistol');
    expect(r.ok).toBe(false);
  });
});
