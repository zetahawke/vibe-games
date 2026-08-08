import { describe, expect, it } from 'vitest';
import { generateQuestion } from '@/domain/math/mathGenerator';

function seq(nums: number[]) {
  let i = 0;
  return () => nums[i++] ?? 0;
}

describe('mathGenerator', () => {
  it('additions difficulty 1 produces solvable prompt', () => {
    const q = generateQuestion('additions', 1, seq([0.1, 0.2]));
    expect(q.prompt.startsWith('¿Cuánto es')).toBe(true);
    expect(typeof q.answer).toBe('number');
  });

  it('divisions answers are integers', () => {
    for (let d = 1; d <= 3; d++) {
      const q = generateQuestion('divisions', d, () => Math.random());
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(q.answer).toBeGreaterThan(0);
    }
  });

  it('subtractions never negative', () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('subtractions', 2, Math.random);
      expect(q.answer).toBeGreaterThanOrEqual(0);
    }
  });
});
