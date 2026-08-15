import { describe, expect, it } from 'vitest';
import {
  BOW_ARROW_LENGTH,
  KUNAI_PROJ_SIZE,
  KUNAI_PROJ_SPEED,
  SHURIKEN_PROJ_SIZE,
} from '@/game/world/projectiles';

describe('projectile visuals', () => {
  it('uses elongated bow arrows', () => {
    expect(BOW_ARROW_LENGTH).toBe(1.1);
  });

  it('uses a thick black shuriken box footprint', () => {
    expect(SHURIKEN_PROJ_SIZE.x).toBeGreaterThanOrEqual(0.16);
    expect(SHURIKEN_PROJ_SIZE.z).toBeGreaterThanOrEqual(0.16);
  });

  it('kunai projectiles are dagger-shaped and slower than pistol', () => {
    expect(KUNAI_PROJ_SIZE.z).toBeGreaterThan(KUNAI_PROJ_SIZE.x);
    expect(KUNAI_PROJ_SPEED).toBe(36);
    expect(KUNAI_PROJ_SPEED).toBeLessThan(48);
  });
});
