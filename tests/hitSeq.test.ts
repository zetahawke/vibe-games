import { describe, expect, it } from 'vitest';
import { takeNewHits } from '@/domain/online/hitSeq';

describe('takeNewHits', () => {
  it('applies only hits newer than lastApplied, in order', () => {
    const { hits, nextLast } = takeNewHits(
      [
        { seq: 1, netId: 2, dmg: 5 },
        { seq: 3, netId: 2, dmg: 8 },
        { seq: 2, netId: 4, dmg: 3 },
      ],
      1,
    );
    expect(hits.map((h) => h.seq)).toEqual([2, 3]);
    expect(nextLast).toBe(3);
  });

  it('returns empty when nothing new', () => {
    const { hits, nextLast } = takeNewHits([{ seq: 1, netId: 1, dmg: 1 }], 1);
    expect(hits).toEqual([]);
    expect(nextLast).toBe(1);
  });
});
