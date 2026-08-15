import { describe, expect, it } from 'vitest';
import { BASE_ZOMBIE_SPEED } from '@/game/world/enemy';

describe('BASE_ZOMBIE_SPEED', () => {
  it('is 20% above the original 1.85 baseline', () => {
    expect(BASE_ZOMBIE_SPEED).toBe(2.22);
  });
});
