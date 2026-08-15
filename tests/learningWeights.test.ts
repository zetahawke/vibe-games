import { describe, expect, it } from 'vitest';
import {
  LEARNING_QUIZ_ATTEMPTS,
  SUBJECT_REWARD_BASE,
  SUBJECT_SCORE,
  SUBJECT_WEIGHTS,
} from '@/domain/learning/weights';

describe('learning weights', () => {
  it('matches locked spawn weights', () => {
    expect(SUBJECT_WEIGHTS).toEqual({
      math: 45,
      english: 25,
      language: 10,
      science: 10,
      history: 10,
    });
    expect(Object.values(SUBJECT_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('matches reward bases and score points', () => {
    expect(SUBJECT_REWARD_BASE.math).toBe(6);
    expect(SUBJECT_REWARD_BASE.english).toBe(5);
    expect(SUBJECT_REWARD_BASE.language).toBe(5);
    expect(SUBJECT_REWARD_BASE.science).toBe(5);
    expect(SUBJECT_REWARD_BASE.history).toBe(5);
    expect(SUBJECT_SCORE).toEqual(SUBJECT_REWARD_BASE);
  });

  it('uses 2 attempts', () => {
    expect(LEARNING_QUIZ_ATTEMPTS).toBe(2);
  });
});
