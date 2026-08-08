import { describe, expect, it } from 'vitest';
import { playGunshot, playWeaponUpgrade } from '@/shared/sfx';

describe('sfx', () => {
  it('gunshot and upgrade jingles no-op without AudioContext', () => {
    expect(() => playGunshot('pistol')).not.toThrow();
    expect(() => playGunshot('shotgun')).not.toThrow();
    expect(() => playGunshot('rifle')).not.toThrow();
    expect(() => playGunshot('knife')).not.toThrow();
    expect(() => playWeaponUpgrade(0)).not.toThrow();
  });
});
