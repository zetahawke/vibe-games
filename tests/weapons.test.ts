import { describe, it, expect } from 'vitest';
import { WEAPONS, zombieHpForWave, getWeapon } from '../src/weapons/weapons';

describe('weapons', () => {
  it('starts with free cuchillo', () => {
    expect(getWeapon('cuchillo').price).toBe(0);
  });

  it('wave 1 zombie dies in 3 cuchillo hits or 1 pistola hit', () => {
    const hp = zombieHpForWave(1);
    expect(hp).toBe(WEAPONS.cuchillo.damage * 3);
    expect(hp).toBe(WEAPONS.pistola.damage);
  });

  it('wave 5 zombie dies in 5 pistola hits or 1 escopeta hit', () => {
    const hp = zombieHpForWave(5);
    expect(hp).toBe(WEAPONS.pistola.damage * 5);
    expect(hp).toBe(WEAPONS.escopeta.damage);
  });
});
