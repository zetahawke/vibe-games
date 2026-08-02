import { describe, expect, it } from 'vitest';
import { overlaps } from '../src/world/aabb';

describe('aabb', () => {
  it('detects overlap', () => {
    expect(
      overlaps(
        { minX: 0, maxX: 2, minZ: 0, maxZ: 2 },
        { minX: 1, maxX: 3, minZ: 1, maxZ: 3 },
      ),
    ).toBe(true);
  });

  it('detects separation', () => {
    expect(
      overlaps(
        { minX: 0, maxX: 1, minZ: 0, maxZ: 1 },
        { minX: 2, maxX: 3, minZ: 2, maxZ: 3 },
      ),
    ).toBe(false);
  });
});
