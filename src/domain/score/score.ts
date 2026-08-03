import { MathTopic } from '@/config/gameConfig';

/** Kill score: 10 + (10 × oleada). */
export function scoreForKill(wave: number): number {
  return 10 + 10 * Math.max(1, wave);
}

/**
 * Topic difficulty factor for quiz score:
 * restas 1, sumas 2, multiplicaciones 3, divisiones 4.
 * mixto uses the resolved sub-topic of the question.
 */
export function topicScoreFactor(topic: MathTopic): number {
  switch (topic) {
    case 'restas':
      return 1;
    case 'sumas':
      return 2;
    case 'multiplicaciones':
      return 3;
    case 'divisiones':
      return 4;
    case 'mixto':
      return 2;
  }
}

/** Quiz score: 2 + (2 × factor de tema). */
export function scoreForQuiz(topic: MathTopic): number {
  return 2 + 2 * topicScoreFactor(topic);
}
