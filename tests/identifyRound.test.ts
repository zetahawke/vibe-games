import { describe, expect, it } from 'vitest';
import { poolForTheme } from '@/domain/identify/catalog';
import { pickIdentifyRound } from '@/domain/identify/round';

describe('pickIdentifyRound', () => {
  it('returns 3 or 4 unique ids from theme pool', () => {
    for (let i = 0; i < 40; i++) {
      const theme = (['vocales', 'numeros', 'abecedario'] as const)[i % 3]!;
      const pool = poolForTheme(theme);
      const r = pickIdentifyRound(theme);
      expect([3, 4]).toContain(r.length);
      expect(new Set(r).size).toBe(r.length);
      for (const id of r) expect(pool).toContain(id);
    }
  });

  it('can force length 3 via rng', () => {
    let n = 0;
    const values = [0.1, 0.0, 0.1, 0.2, 0.3];
    const r = pickIdentifyRound('vocales', () => values[n++] ?? 0.5);
    expect(r.length).toBe(3);
  });
});
