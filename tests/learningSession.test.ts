import { describe, expect, it } from 'vitest';
import { loadCurriculum } from '@/domain/learning/loadCurriculum';
import {
  adjustDifficulty,
  coinsEarned,
  startLearningQuiz,
  submitChoice,
} from '@/domain/learning/session';
import { LEARNING_QUIZ_ATTEMPTS, SUBJECT_REWARD_BASE } from '@/domain/learning/weights';

describe('learning session', () => {
  const bank = loadCurriculum('Chile', '2do');
  const rng = () => 0.01;

  it('starts with 2 attempts and positive reward', () => {
    const s = startLearningQuiz(bank, 2, rng);
    expect(s.attemptsLeft).toBe(LEARNING_QUIZ_ATTEMPTS);
    expect(s.status).toBe('active');
    expect(s.reward).toBe(SUBJECT_REWARD_BASE[s.subjectId] * 2);
  });

  it('wins on correct choice', () => {
    const s0 = startLearningQuiz(bank, 1, rng);
    const s1 = submitChoice(s0, s0.question.correctIndex);
    expect(s1.status).toBe('won');
    expect(coinsEarned(s1)).toBe(s1.reward);
  });

  it('fails after 2 wrong answers', () => {
    const s0 = startLearningQuiz(bank, 1, rng);
    const wrong = s0.question.correctIndex === 0 ? 1 : 0;
    const s1 = submitChoice(s0, wrong);
    expect(s1.status).toBe('active');
    expect(s1.attemptsLeft).toBe(1);
    const s2 = submitChoice(s1, wrong);
    expect(s2.status).toBe('failed');
    expect(coinsEarned(s2)).toBe(0);
  });

  it('adjustDifficulty reclamps and picks new question', () => {
    const s0 = startLearningQuiz(bank, 1, rng);
    const s1 = adjustDifficulty(s0, -1, rng);
    expect(s1.difficulty).toBe(1);
    const s2 = adjustDifficulty(s0, 1, rng);
    expect(s2.difficulty).toBe(2);
  });
});
