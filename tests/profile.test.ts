import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_PREFIX } from '@/config/gameConfig';
import {
  CHILE_GRADES,
  defaultProfile,
  gradeLabel,
  isPlayableGrade,
  loadProfile,
  migrateGrade,
  normalizeProfile,
  normalizeShirtId,
  profileFromApi,
  saveProfile,
  tryBuyCosmetic,
} from '@/domain/profile/profile';

describe('migrateGrade', () => {
  it('maps old english ids and 7th to 2do', () => {
    expect(migrateGrade('7th')).toBe('2do');
    expect(migrateGrade('7mo')).toBe('2do');
    expect(migrateGrade('5th')).toBe('5to');
    expect(migrateGrade('2do')).toBe('2do');
  });
});

describe('chile grades', () => {
  it('lists 1ro through 8vo and only 2do is playable', () => {
    expect(CHILE_GRADES.map((g) => g.id)).toEqual([
      '1ro', '2do', '3ro', '4to', '5to', '6to', '7mo', '8vo',
    ]);
    expect(CHILE_GRADES.filter((g) => isPlayableGrade(g.id))).toEqual([
      { id: '2do', label: '2do Básico', enabled: true },
    ]);
    expect(gradeLabel('2do')).toBe('2do Básico');
  });
});

describe('local profile', () => {
  beforeEach(() => localStorage.clear());

  it('defaults overlays to none and gems to 0 with legacy owned', () => {
    const d = defaultProfile();
    expect(d.hatId).toBe('none');
    expect(d.hairId).toBe('none');
    expect(d.gems).toBe(0);
    expect(d.ownedHats).toEqual(expect.arrayContaining(['none', 'cap']));
    expect(d.ownedShirts).toEqual(expect.arrayContaining(['none', 'jersey', 'armor']));
  });

  it('roundtrips grade sex color and overlays', () => {
    const p = {
      ...defaultProfile(),
      sex: 'girl' as const,
      color: '#c94c4c',
      displayName: 'hija',
      hatId: 'cap' as const,
      shirtId: 'jersey' as const,
      pantsId: 'shinguards' as const,
    };
    saveProfile('hija', p);
    expect(loadProfile('hija')).toEqual(p);
  });

  it('old saves without overlays become none and seed legacy owned', () => {
    localStorage.setItem(`${STORAGE_PREFIX}profile:old`, JSON.stringify({
      grade: '2do', sex: 'boy', color: '#2f6fed', displayName: 'old',
    }));
    const loaded = loadProfile('old');
    expect(loaded?.shirtId).toBe('none');
    expect(loaded?.gems).toBe(0);
    expect(loaded?.ownedHats).toEqual(expect.arrayContaining(['cap']));
    expect(loaded?.hairId).toBe('none');
  });

  it('rejects unknown overlay ids', () => {
    expect(normalizeShirtId('cape')).toBe('none');
    expect(normalizeShirtId('armor')).toBe('armor');
  });

  it('profileFromApi reads avatar overlay columns', () => {
    const p = profileFromApi({
      grade: '2do',
      avatar_sex: 'girl',
      avatar_color: '#c94c4c',
      display_name: 'hija',
      avatar_hat: 'cap',
      avatar_shirt: 'armor',
      avatar_pants: 'nope',
    });
    expect(p.hatId).toBe('cap');
    expect(p.shirtId).toBe('armor');
    expect(p.pantsId).toBe('none');
  });

  it('unequips cosmetics that are not owned', () => {
    const p = normalizeProfile({
      ...defaultProfile(),
      hatId: 'beanie',
      ownedHats: ['none', 'cap'],
    });
    expect(p.hatId).toBe('none');
  });

  it('tryBuyCosmetic spends gems and unlocks', () => {
    const base = { ...defaultProfile(), gems: 10 };
    const bought = tryBuyCosmetic(base, 'hat', 'beanie');
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    expect(bought.profile.gems).toBe(0);
    expect(bought.profile.ownedHats).toContain('beanie');
    expect(bought.profile.hatId).toBe('beanie');
  });

  it('tryBuyCosmetic fails without funds', () => {
    const r = tryBuyCosmetic(defaultProfile(), 'shirt', 'jersey_argentina');
    expect(r).toEqual({ ok: false, reason: 'funds' });
  });

  it('returns null when never saved', () => {
    expect(loadProfile('papa')).toBeNull();
  });
});
