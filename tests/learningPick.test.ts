import { describe, expect, it } from 'vitest';
import { loadCurriculum } from '@/domain/learning/loadCurriculum';
import { pickQuestion, pickSubjectId } from '@/domain/learning/pickQuestion';
import { SUBJECT_WEIGHTS } from '@/domain/learning/weights';

describe('pickQuestion', () => {
  const bank = loadCurriculum('Chile', '2do');

  it('pickSubjectId respects weight bands with fixed rng', () => {
    expect(pickSubjectId(() => 0)).toBe('math');
    expect(pickSubjectId(() => 0.44)).toBe('math');
    expect(pickSubjectId(() => 0.45)).toBe('english');
    expect(pickSubjectId(() => 0.70)).toBe('language');
    expect(pickSubjectId(() => 0.80)).toBe('science');
    expect(pickSubjectId(() => 0.90)).toBe('history');
  });

  it('returns question at requested difficulty when available', () => {
    const q = pickQuestion(bank, 1, () => 0.01);
    expect(q.difficulty).toBe(1);
    expect(q.options[q.correctIndex]).toBeDefined();
  });

  it('never throws on empty filter (fallback)', () => {
    expect(() => pickQuestion(bank, 3, () => 0.99)).not.toThrow();
  });

  it('approx weight distribution over many picks', () => {
    let i = 0;
    const seq = Array.from({ length: 1000 }, (_, k) => (k % 100) / 100);
    const counts: Record<string, number> = {};
    for (let n = 0; n < 1000; n++) {
      const id = pickSubjectId(() => seq[i++ % seq.length]);
      counts[id] = (counts[id] ?? 0) + 1;
    }
    expect(counts.math).toBe(SUBJECT_WEIGHTS.math * 10);
    expect(counts.english).toBe(SUBJECT_WEIGHTS.english * 10);
  });
});
