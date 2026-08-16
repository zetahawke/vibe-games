import { describe, expect, it } from 'vitest';
import { playGunshot, playWeaponUpgrade, WEAPON_SHOT_URL } from '@/shared/sfx';
import { weaponIconSvg } from '@/domain/weapons/weaponVisuals';

describe('sfx', () => {
  it('gunshot and upgrade jingles no-op without AudioContext', () => {
    expect(() => playGunshot('pistol')).not.toThrow();
    expect(() => playGunshot('shotgun')).not.toThrow();
    expect(() => playGunshot('rifle')).not.toThrow();
    expect(() => playGunshot('knife')).not.toThrow();
    expect(() => playGunshot('bow')).not.toThrow();
    expect(() => playGunshot('sword_shield')).not.toThrow();
    expect(() => playGunshot('longsword')).not.toThrow();
    expect(() => playGunshot('kunai')).not.toThrow();
    expect(() => playGunshot('shuriken')).not.toThrow();
    expect(() => playWeaponUpgrade(0)).not.toThrow();
  });

  it('maps weapon kinds to public gun samples', () => {
    expect(WEAPON_SHOT_URL.kunai).toBe(WEAPON_SHOT_URL.shuriken);
    expect(WEAPON_SHOT_URL.shuriken).toBe('/guns/shuriken.mp3');
    expect(WEAPON_SHOT_URL.pistol).toBe('/guns/pistol.mp3');
    expect(WEAPON_SHOT_URL.knife).toBe('/guns/sword.mp3');
    expect(WEAPON_SHOT_URL.bow).toBe('/guns/bow.mp3');
  });
});

describe('weaponIconSvg', () => {
  it('returns svg for new weapons', () => {
    expect(weaponIconSvg('bow')).toContain('<svg');
    expect(weaponIconSvg('sword_shield')).toContain('<svg');
    expect(weaponIconSvg('longsword_upgraded')).toContain('<svg');
  });
});
