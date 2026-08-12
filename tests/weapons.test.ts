import { describe, it, expect } from 'vitest';
import {
  WEAPONS,
  zombieHpForWave,
  getWeapon,
  weaponUpgradeSfxIndex,
  resolveWeaponId,
  WEAPON_IDS,
} from '@/domain/weapons/weapons';

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

  it('maps shop weapons onto four recycled upgrade jingles', () => {
    const indices = WEAPON_IDS
      .filter((id) => id !== 'knife')
      .map((id) => weaponUpgradeSfxIndex(id));
    expect(new Set(indices).size).toBe(4);
    expect(indices.every((i) => i >= 0 && i <= 3)).toBe(true);
    expect(weaponUpgradeSfxIndex('rifle')).toBe(weaponUpgradeSfxIndex('pistol'));
  });

  it('exposes new arsenal with grips and shop prices', () => {
    expect(getWeapon('bow').grip).toBe('twoHand');
    expect(getWeapon('bow').isMelee).toBe(false);
    expect(getWeapon('bow').price).toBe(50);
    expect(getWeapon('bow').damage).toBe(50);
    expect(getWeapon('sword_shield').grip).toBe('paired');
    expect(getWeapon('sword_shield').isMelee).toBe(true);
    expect(getWeapon('sword_shield').price).toBe(20);
    expect(getWeapon('longsword').grip).toBe('twoHand');
    expect(getWeapon('longsword_upgraded').damage).toBe(60);
    expect(getWeapon('bow_upgraded').price).toBe(140);
  });

  it('resolveWeaponId falls back to knife', () => {
    expect(resolveWeaponId('nope')).toBe('knife');
  });

  it('zombieHpForWave still matches knife/pistol/shotgun curve', () => {
    expect(zombieHpForWave(1)).toBe(WEAPONS.knife.damage * 2);
    expect(zombieHpForWave(5)).toBe(WEAPONS.pistol.damage * 5);
    expect(zombieHpForWave(5)).toBe(WEAPONS.shotgun.damage);
  });
});
