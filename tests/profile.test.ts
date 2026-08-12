import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_PREFIX } from '@/config/gameConfig';
import {
  CHILE_GRADES,
  defaultProfile,
  gradeLabel,
  isPlayableGrade,
  loadProfile,
  migrateGrade,
  normalizeShirtId,
  profileFromApi,
  saveProfile,
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

  it('defaults overlays to none', () => {
    expect(defaultProfile().hatId).toBe('none');
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

  it('old saves without overlays become none', () => {
    localStorage.setItem(`${STORAGE_PREFIX}profile:old`, JSON.stringify({
      grade: '2do', sex: 'boy', color: '#2f6fed', displayName: 'old',
    }));
    expect(loadProfile('old')?.shirtId).toBe('none');
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

  it('returns null when never saved', () => {
    expect(loadProfile('papa')).toBeNull();
  });
});
