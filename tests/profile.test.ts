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
  type PlayerProfile,
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

  it('defaults overlays to none and gems to 0 without preowned cosmetics', () => {
    const d = defaultProfile();
    expect(d.hatId).toBe('none');
    expect(d.hairId).toBe('none');
    expect(d.gems).toBe(0);
    expect(d.ownedHats).toEqual(['none']);
    expect(d.ownedShirts).toEqual(['none']);
    expect(d.ownedPants).toEqual(['none']);
  });

  it('roundtrips paid cosmetics', () => {
    const p: PlayerProfile = {
      ...defaultProfile(),
      sex: 'girl',
      color: '#c94c4c',
      displayName: 'hija',
      ownedHats: ['none', 'beanie'],
      ownedShirts: ['none', 'jersey_argentina'],
      ownedPants: ['none', 'shorts_football'],
      hatId: 'beanie',
      shirtId: 'jersey_argentina',
      pantsId: 'shorts_football',
    };
    saveProfile('hija', p);
    expect(loadProfile('hija')).toEqual(p);
  });

  it('old saves without overlays become none with empty inventory', () => {
    localStorage.setItem(`${STORAGE_PREFIX}profile:old`, JSON.stringify({
      grade: '2do', sex: 'boy', color: '#2f6fed', displayName: 'old',
    }));
    const loaded = loadProfile('old');
    expect(loaded?.shirtId).toBe('none');
    expect(loaded?.gems).toBe(0);
    expect(loaded?.ownedHats).toEqual(['none']);
    expect(loaded?.hairId).toBe('none');
  });

  it('rejects unknown overlay ids', () => {
    expect(normalizeShirtId('cape')).toBe('none');
    expect(normalizeShirtId('armor')).toBe('armor');
  });

  it('profileFromApi unequips complimentary cosmetics without ownership', () => {
    const p = profileFromApi({
      grade: '2do',
      avatar_sex: 'girl',
      avatar_color: '#c94c4c',
      display_name: 'hija',
      avatar_hat: 'cap',
      avatar_shirt: 'armor',
      avatar_pants: 'nope',
    });
    expect(p.hatId).toBe('none');
    expect(p.shirtId).toBe('none');
    expect(p.pantsId).toBe('none');
  });

  it('unequips cosmetics that are not owned', () => {
    const p = normalizeProfile({
      ...defaultProfile(),
      hatId: 'beanie',
      ownedHats: ['none'],
    });
    expect(p.hatId).toBe('none');
  });

  it('revokes previously free complimentary cosmetics from inventory', () => {
    const p = normalizeProfile({
      ...defaultProfile(),
      ownedHats: ['none', 'cap', 'beanie'],
      ownedShirts: ['none', 'jersey', 'armor'],
      hatId: 'cap',
      shirtId: 'jersey',
    });
    expect(p.ownedHats).toEqual(['none', 'beanie']);
    expect(p.ownedShirts).toEqual(['none']);
    expect(p.hatId).toBe('none');
    expect(p.shirtId).toBe('none');
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

  it('cap jersey armor and shinguards cost gems', () => {
    expect(tryBuyCosmetic({ ...defaultProfile(), gems: 10 }, 'hat', 'cap').ok).toBe(true);
    expect(tryBuyCosmetic({ ...defaultProfile(), gems: 10 }, 'shirt', 'jersey').ok).toBe(true);
    expect(tryBuyCosmetic({ ...defaultProfile(), gems: 20 }, 'shirt', 'armor').ok).toBe(true);
    expect(tryBuyCosmetic({ ...defaultProfile(), gems: 10 }, 'pants', 'shinguards').ok).toBe(true);
  });

  it('returns null when never saved', () => {
    expect(loadProfile('papa')).toBeNull();
  });
});
