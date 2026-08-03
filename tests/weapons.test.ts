import { describe, it, expect } from 'vitest';
import { WEAPONS, zombieHpForWave, getWeapon } from '@/domain/weapons/weapons';

describe('weapons', () => {
  it('starts with free cuchillo', () => {
    expect(getWeapon('cuchillo').price).toBe(0);
  });

  it('wave 1 zombie dies in 2 cuchillo hits', () => {
    const hp = zombieHpForWave(1);
    expect(hp).toBe(WEAPONS.cuchillo.damage * 2);
  });

  it('wave 5 zombie dies in 5 pistola hits or 1 escopeta hit', () => {
    const hp = zombieHpForWave(5);
    expect(hp).toBe(WEAPONS.pistola.damage * 5);
    expect(hp).toBe(WEAPONS.escopeta.damage);
  });
});
