import { clampDifficulty } from '@/shared/math';
import { pickQuestion } from './pickQuestion';
import type { CurriculumBank, LearningQuizState } from './types';
import { LEARNING_QUIZ_ATTEMPTS, SUBJECT_REWARD_BASE, SUBJECT_SCORE } from './weights';
import type { SubjectId } from './types';

export function scoreForSubject(subjectId: SubjectId): number {
  return SUBJECT_SCORE[subjectId];
}

export function startLearningQuiz(
  bank: CurriculumBank,
  difficulty: number,
  rng: () => number = Math.random,
): LearningQuizState {
  const d = clampDifficulty(difficulty);
  const question = pickQuestion(bank, d, rng);
  return {
    bank,
    subjectId: question.subjectId,
    subjectName: question.subjectName,
    difficulty: d,
    question,
    attemptsLeft: LEARNING_QUIZ_ATTEMPTS,
    reward: SUBJECT_REWARD_BASE[question.subjectId] * d,
    status: 'active',
    lastMessage: '',
  };
}

export function adjustDifficulty(
  state: LearningQuizState,
  delta: -1 | 1,
  rng: () => number = Math.random,
): LearningQuizState {
  return startLearningQuiz(state.bank, state.difficulty + delta, rng);
}

export function submitChoice(state: LearningQuizState, optionIndex: number): LearningQuizState {
  if (state.status !== 'active') return state;

  if (optionIndex === state.question.correctIndex) {
    return {
      ...state,
      status: 'won',
      attemptsLeft: state.attemptsLeft - 1,
      lastMessage: '¡Correcto!',
    };
  }

  const attemptsLeft = state.attemptsLeft - 1;
  if (attemptsLeft <= 0) {
    return {
      ...state,
      attemptsLeft: 0,
      status: 'failed',
      lastMessage: 'Se acabaron los intentos. +0 monedas',
    };
  }

  return {
    ...state,
    attemptsLeft,
    lastMessage: `Incorrecto. Te quedan ${attemptsLeft} intentos`,
  };
}

export function coinsEarned(state: LearningQuizState): number {
  return state.status === 'won' ? state.reward : 0;
}
