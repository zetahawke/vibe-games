import { beforeEach, describe, expect, it } from 'vitest';
import {
  defaultSave,
  loadSave,
  writeSave,
  clearSave,
  getHighScore,
  updateHighScore,
} from '@/domain/save/save';

const mathSave = () =>
  defaultSave({ subject: 'math', grade: '7th', englishGrade: '7th', mathTopic: 'additions' });

beforeEach(() => localStorage.clear());

describe('save', () => {
  it('roundtrips a save', () => {
    const s = mathSave();
    s.coins = 12;
    writeSave('ana', s);
    expect(loadSave('ana')?.coins).toBe(12);
  });

  it('clearSave removes active game but high score remains', () => {
    writeSave('ana', mathSave());
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

  it('migrates old saves missing skipCoins, wavesCleared, quizStreak', () => {
    const old = mathSave();
    const { skipCoins: _sc, wavesCleared: _wc, quizStreak: _qs, ...rest } = old as any;
    localStorage.setItem('juegos-de-casa:v1:save:ana', JSON.stringify(rest));
    const loaded = loadSave('ana');
    expect(loaded?.skipCoins).toBe(0);
    expect(loaded?.wavesCleared).toBe(0);
    expect(loaded?.quizStreak).toBe(0);
  });
});
