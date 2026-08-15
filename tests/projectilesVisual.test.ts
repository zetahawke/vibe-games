import { describe, expect, it } from 'vitest';
import { BOW_ARROW_LENGTH, SHURIKEN_PROJ_SIZE } from '@/game/world/projectiles';

describe('projectile visuals', () => {
  it('uses elongated bow arrows', () => {
    expect(BOW_ARROW_LENGTH).toBe(1.1);
  });
  it('uses a thick black shuriken box footprint', () => {
    expect(SHURIKEN_PROJ_SIZE.x).toBeGreaterThanOrEqual(0.16);
    expect(SHURIKEN_PROJ_SIZE.z).toBeGreaterThanOrEqual(0.16);
  });
});
