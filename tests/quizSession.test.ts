import { describe, expect, it } from 'vitest';
import {
  startQuiz,
  submitAnswer,
  coinsEarned,
  adjustDifficulty,
} from '@/domain/quiz/quizSession';

describe('quizSession', () => {
  it('pays full reward on first try', () => {
    let s = startQuiz('additions', 1, () => 0.1);
    s = submitAnswer(s, s.question.answer);
    expect(s.status).toBe('won');
    expect(coinsEarned(s)).toBe(s.reward);
  });

  it('gives 0 after 3 wrong answers', () => {
    let s = startQuiz('additions', 2, () => 0.2);
    const wrong = s.question.answer + 999;
    s = submitAnswer(s, wrong);
    s = submitAnswer(s, wrong);
    s = submitAnswer(s, wrong);
    expect(s.status).toBe('failed');
    expect(coinsEarned(s)).toBe(0);
  });

  it('lower difficulty refreshes question', () => {
    const s0 = startQuiz('additions', 3, () => 0.3);
    const s1 = adjustDifficulty(s0, -1, () => 0.4);
    expect(s1.difficulty).toBe(2);
    expect(s1.attemptsLeft).toBe(3);
  });
});
