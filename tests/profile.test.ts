import { beforeEach, describe, expect, it } from 'vitest';
import {
  CHILE_GRADES,
  defaultProfile,
  gradeLabel,
  isPlayableGrade,
  loadProfile,
  migrateGrade,
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

  it('roundtrips grade sex and color', () => {
    const p = { ...defaultProfile(), sex: 'girl' as const, color: '#c94c4c', displayName: 'hija' };
    saveProfile('hija', p);
    expect(loadProfile('hija')).toEqual(p);
  });

  it('returns null when never saved', () => {
    expect(loadProfile('papa')).toBeNull();
  });
});
