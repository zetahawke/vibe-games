import { describe, expect, it } from 'vitest';
import { scoreForKill, scoreForQuiz, ENGLISH_QUIZ_SCORE } from '@/domain/score/score';

describe('score', () => {
  it('kill score scales with wave', () => {
    expect(scoreForKill(1)).toBe(20);
    expect(scoreForKill(3)).toBe(40);
  });

  it('quiz score matches topic difficulty', () => {
    expect(scoreForQuiz('sumas')).toBe(4);
    expect(scoreForQuiz('restas')).toBe(4);
    expect(scoreForQuiz('multiplicaciones')).toBe(8);
    expect(scoreForQuiz('divisiones')).toBe(14);
  });

  it('english quiz score is defined', () => {
    expect(ENGLISH_QUIZ_SCORE).toBeGreaterThan(0);
  });
});
