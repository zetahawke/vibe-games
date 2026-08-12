import { describe, expect, it } from 'vitest';
import { scoreForKill, scoreForQuiz, ENGLISH_QUIZ_SCORE, QUIZ_SCORE } from '@/domain/score/score';

describe('score', () => {
  it('kill score scales with wave', () => {
    expect(scoreForKill(1)).toBe(20);
    expect(scoreForKill(3)).toBe(40);
  });

  it('quiz score stays within topic difficulty band', () => {
    expect(QUIZ_SCORE.additions).toBe(4);
    expect(QUIZ_SCORE.multiplications).toBe(8);
    for (let i = 0; i < 20; i++) {
      const s = scoreForQuiz('additions');
      expect(s).toBeGreaterThanOrEqual(2);
      expect(s).toBeLessThanOrEqual(6);
    }
  });

  it('english quiz score is defined', () => {
    expect(ENGLISH_QUIZ_SCORE).toBeGreaterThan(0);
  });
});
