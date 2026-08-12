import { MathTopic } from '@/config/gameConfig';

/** Kill score: 10 + (10 × wave number). */
export function scoreForKill(wave: number): number {
  return 10 + 10 * Math.max(1, wave);
}

/** Points per correct quiz answer by topic. */
export const QUIZ_SCORE: Record<MathTopic, number> = {
  additions:       4,
  subtractions:    4,
  multiplications: 8,
  divisions:       14,
  mixed:           4, // fallback; mixed always resolves to a real sub-topic
};

const randomizeScoreBetween = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/** Quiz score for the resolved sub-topic of a question. */
export function scoreForQuiz(topic: MathTopic): number {
  return randomizeScoreBetween(QUIZ_SCORE[topic] * 0.5, QUIZ_SCORE[topic] * 1.5) ?? 4;
}

/** English quiz gives a flat score per correct answer. */
export const ENGLISH_QUIZ_SCORE = randomizeScoreBetween(2, 10);
