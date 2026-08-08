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

  it('2do básico mixed never multiplies or divides', () => {
    for (let i = 0; i < 30; i++) {
      const q = generateQuestion('mixed', 2, Math.random, '2do');
      expect(['additions', 'subtractions']).toContain(q.topic);
      expect(q.prompt.includes('×')).toBe(false);
      expect(q.prompt.includes('÷')).toBe(false);
    }
  });

  it('2do básico easy sums stay within 1–20', () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('additions', 1, Math.random, '2do');
      const nums = [...q.prompt.matchAll(/\d+/g)].map((m) => Number(m[0]));
      expect(nums.every((n) => n >= 1 && n <= 20)).toBe(true);
    }
  });
});
