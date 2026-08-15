import type { SubjectId } from './types';

export const SUBJECT_WEIGHTS: Record<SubjectId, number> = {
  math: 45,
  english: 25,
  language: 10,
  science: 10,
  history: 10,
};

export const SUBJECT_REWARD_BASE: Record<SubjectId, number> = {
  math: 6,
  english: 5,
  language: 5,
  science: 5,
  history: 5,
};

export const SUBJECT_SCORE: Record<SubjectId, number> = { ...SUBJECT_REWARD_BASE };

export const LEARNING_QUIZ_ATTEMPTS = 2;
