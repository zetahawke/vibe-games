import { describe, it, expect } from 'vitest';
import { WEAPONS, zombieHpForWave, getWeapon } from '@/domain/weapons/weapons';

describe('weapons', () => {
  it('starts with free knife', () => {
    expect(getWeapon('knife').price).toBe(0);
  });

  it('wave 1 zombie dies in 2 knife hits', () => {
    const hp = zombieHpForWave(1);
    expect(hp).toBe(WEAPONS.knife.damage * 2);
  });

  it('wave 5 zombie dies in 5 pistol hits or 1 shotgun hit', () => {
    const hp = zombieHpForWave(5);
    expect(hp).toBe(WEAPONS.pistol.damage * 5);
    expect(hp).toBe(WEAPONS.shotgun.damage);
  });

  it('upgraded weapons cost and deal more than base', () => {
    expect(WEAPONS.pistol_upgraded.price).toBeGreaterThan(WEAPONS.pistol.price);
    expect(WEAPONS.pistol_upgraded.damage).toBeGreaterThan(WEAPONS.pistol.damage);
    expect(WEAPONS.shotgun_upgraded.price).toBeGreaterThan(WEAPONS.shotgun.price);
    expect(WEAPONS.shotgun_upgraded.damage).toBeGreaterThan(WEAPONS.shotgun.damage);
    expect(WEAPONS.rifle_upgraded.price).toBeGreaterThan(WEAPONS.rifle.price);
    expect(WEAPONS.rifle_upgraded.damage).toBeGreaterThan(WEAPONS.rifle.damage);
  });
});
