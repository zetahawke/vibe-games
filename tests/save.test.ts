import { beforeEach, describe, expect, it } from 'vitest';
import {
  defaultSave,
  loadSave,
  writeSave,
  clearSave,
  getHighScore,
  updateHighScore,
} from '@/domain/save/save';

beforeEach(() => localStorage.clear());

describe('save', () => {
  it('roundtrips a save', () => {
    const s = defaultSave('sumas');
    s.coins = 12;
    writeSave('ana', s);
    expect(loadSave('ana')?.coins).toBe(12);
  });

  it('clearSave removes active game but high score remains', () => {
    writeSave('ana', defaultSave('sumas'));
    updateHighScore('ana', 7);
    clearSave('ana');
    expect(loadSave('ana')).toBeNull();
    expect(getHighScore('ana')).toBe(7);
  });

  it('updateHighScore only increases', () => {
    expect(updateHighScore('ana', 3)).toBe(3);
    expect(updateHighScore('ana', 2)).toBe(3);
    expect(updateHighScore('ana', 10)).toBe(10);
  });
});
