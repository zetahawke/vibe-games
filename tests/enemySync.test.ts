import { describe, expect, it } from 'vitest';
import { reconcileEnemySnapshot } from '@/domain/online/enemySync';

describe('reconcileEnemySnapshot', () => {
  it('drops snapshot entries that were locally killed', () => {
    const tombs = new Set([2]);
    const result = reconcileEnemySnapshot(
      [{ id: 1 }, { id: 2 }, { id: 3 }],
      tombs,
    );
    expect(result.apply.map((e) => e.id)).toEqual([1, 3]);
    expect([...result.tombs]).toEqual([2]);
  });

  it('clears a tombstone once the host snapshot no longer includes that id', () => {
    const tombs = new Set([2, 5]);
    const result = reconcileEnemySnapshot([{ id: 1 }, { id: 2 }], tombs);
    expect(result.apply.map((e) => e.id)).toEqual([1]);
    expect([...result.tombs]).toEqual([2]);
  });

  it('applies the full snapshot when there are no tombstones', () => {
    const result = reconcileEnemySnapshot([{ id: 1 }, { id: 4 }], new Set());
    expect(result.apply.map((e) => e.id)).toEqual([1, 4]);
    expect(result.tombs.size).toBe(0);
  });
});
