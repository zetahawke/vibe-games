import { MathTopic, QUIZ_MAX_ATTEMPTS } from '@/config/gameConfig';
import { generateQuestion, MathQuestion } from '@/domain/math/mathGenerator';
import { QUIZ_SCORE } from '@/domain/score/score';
import { clampDifficulty } from '@/shared/math';

export interface QuizState {
  topic: MathTopic;
  difficulty: number;
  question: MathQuestion;
  attemptsLeft: number;
  reward: number;
  status: 'active' | 'won' | 'failed';
  lastMessage: string;
}

/**
 * Coins = topic base × difficulty level.
 * Uses the resolved sub-topic from the generated question so 'mixed'
 * rewards correctly (e.g. a divisions question inside mixed gives 14 × diff).
 */
function rewardFor(topic: MathTopic, difficulty: number): number {
  const base = QUIZ_SCORE[topic] ?? 4;
  return base * clampDifficulty(difficulty);
}

export function startQuiz(
  topic: MathTopic,
  difficulty: number,
  rng?: () => number,
): QuizState {
  const d = clampDifficulty(difficulty);
  const question = generateQuestion(topic, d, rng);
  return {
    topic,
    difficulty: d,
    question,
    attemptsLeft: QUIZ_MAX_ATTEMPTS,
    reward: rewardFor(question.topic, d),
    status: 'active',
    lastMessage: '',
  };
}

export function adjustDifficulty(
  state: QuizState,
  delta: -1 | 1,
  rng?: () => number,
): QuizState {
  return startQuiz(state.topic, state.difficulty + delta, rng);
}

export function submitAnswer(state: QuizState, value: number): QuizState {
  if (state.status !== 'active') return state;

  if (value === state.question.answer) {
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

export function coinsEarned(state: QuizState): number {
  return state.status === 'won' ? state.reward : 0;
}
