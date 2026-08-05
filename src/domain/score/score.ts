import { MathTopic } from '@/config/gameConfig';

/** Kill score: 10 + (10 × oleada). */
export function scoreForKill(wave: number): number {
  return 10 + 10 * Math.max(1, wave);
}

/** Points per correct quiz answer, by resolved topic. */
export const QUIZ_SCORE: Record<MathTopic, number> = {
  sumas:           4,
  restas:          4,
  multiplicaciones: 8,
  divisiones:      14,
  mixto:           4, // fallback; mixto always resolves to real sub-topic
};

/** Quiz score for the resolved sub-topic of a question. */
export function scoreForQuiz(topic: MathTopic): number {
  return QUIZ_SCORE[topic] ?? 4;
}

/** English quiz gives a flat score per answer. */
export const ENGLISH_QUIZ_SCORE = 6;
