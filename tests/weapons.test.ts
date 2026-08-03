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

  it('mejorada weapons cost and deal more than base', () => {
    expect(WEAPONS.pistola_mejorada.price).toBeGreaterThan(WEAPONS.pistola.price);
    expect(WEAPONS.pistola_mejorada.damage).toBeGreaterThan(WEAPONS.pistola.damage);
    expect(WEAPONS.escopeta_mejorada.price).toBeGreaterThan(WEAPONS.escopeta.price);
    expect(WEAPONS.escopeta_mejorada.damage).toBeGreaterThan(WEAPONS.escopeta.damage);
    expect(WEAPONS.rifle_mejorada.price).toBeGreaterThan(WEAPONS.rifle.price);
    expect(WEAPONS.rifle_mejorada.damage).toBeGreaterThan(WEAPONS.rifle.damage);
  });
});
