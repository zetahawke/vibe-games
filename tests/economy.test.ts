import { describe, expect, it } from 'vitest';
import { buyWeapon } from '@/domain/economy/economy';

describe('economy', () => {
  it('buys pistola when enough coins', () => {
    const r = buyWeapon(20, ['cuchillo'], 'pistola');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.coins).toBe(5);
      expect(r.owned).toContain('pistola');
    }
  });

  it('rejects if already owned', () => {
    const r = buyWeapon(100, ['cuchillo', 'pistola'], 'pistola');
    expect(r.ok).toBe(false);
  });
});
