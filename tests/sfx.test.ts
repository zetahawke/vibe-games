import { describe, expect, it } from 'vitest';
import { playGunshot, playWeaponUpgrade } from '@/shared/sfx';
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
    expect(() => playWeaponUpgrade(0)).not.toThrow();
  });
});

describe('weaponIconSvg', () => {
  it('returns svg for new weapons', () => {
    expect(weaponIconSvg('bow')).toContain('<svg');
    expect(weaponIconSvg('sword_shield')).toContain('<svg');
    expect(weaponIconSvg('longsword_upgraded')).toContain('<svg');
  });
});
