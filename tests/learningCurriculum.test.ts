import { describe, expect, it } from 'vitest';
import { loadCurriculum } from '@/domain/learning/loadCurriculum';

describe('loadCurriculum', () => {
  it('loads Chile 2do with english keys and five subjects', () => {
    const bank = loadCurriculum('Chile', '2do');
    expect(bank.course).toContain('2do');
    expect(bank.subjects.map((s) => s.id).sort()).toEqual(
      ['english', 'history', 'language', 'math', 'science'].sort(),
    );
    for (const s of bank.subjects) {
      for (const u of s.units) {
        for (const q of u.questions) {
          expect(q.options).toHaveLength(3);
          expect(q.options).toContain(q.correctAnswer);
          expect([1, 2, 3]).toContain(q.difficulty);
        }
      }
    }
  });

  it('math has at least 24 questions', () => {
    const bank = loadCurriculum('Chile', '2do');
    const math = bank.subjects.find((s) => s.id === 'math')!;
    const n = math.units.reduce((acc, u) => acc + u.questions.length, 0);
    expect(n).toBeGreaterThanOrEqual(24);
  });
});
