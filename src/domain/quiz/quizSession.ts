import { MathTopic, QUIZ_MAX_ATTEMPTS } from '@/config/gameConfig';
import { generateQuestion, MathQuestion } from '@/domain/math/mathGenerator';
import { QUIZ_SCORE } from '@/domain/score/score';

export interface QuizState {
  topic: MathTopic;
  difficulty: number;
  question: MathQuestion;
  attemptsLeft: number;
  reward: number;
  status: 'active' | 'won' | 'failed';
  lastMessage: string;
}

function clampDifficulty(difficulty: number): number {
  return Math.min(3, Math.max(1, Math.floor(difficulty)));
}

/**
 * Coins = base por tema × nivel de dificultad.
 * sumas/restas diff 1 → 4 · diff 2 → 8 · diff 3 → 12
 * multiplicaciones diff 1 → 8 · diff 2 → 16 · diff 3 → 24
 * divisiones      diff 1 → 14 · diff 2 → 28 · diff 3 → 42
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
  return {
    topic,
    difficulty: d,
    question: generateQuestion(topic, d, rng),
    attemptsLeft: QUIZ_MAX_ATTEMPTS,
    reward: rewardFor(topic, d),
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
