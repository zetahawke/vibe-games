import { describe, expect, it } from 'vitest';
import { scoreForKill, scoreForQuiz, topicScoreFactor } from '../src/score/score';

describe('score', () => {
  it('kill score scales with wave', () => {
    expect(scoreForKill(1)).toBe(20);
    expect(scoreForKill(3)).toBe(40);
  });

  it('quiz score uses topic factors', () => {
    expect(topicScoreFactor('restas')).toBe(1);
    expect(topicScoreFactor('sumas')).toBe(2);
    expect(topicScoreFactor('multiplicaciones')).toBe(3);
    expect(topicScoreFactor('divisiones')).toBe(4);
    expect(scoreForQuiz('sumas')).toBe(6);
    expect(scoreForQuiz('divisiones')).toBe(10);
  });
});
