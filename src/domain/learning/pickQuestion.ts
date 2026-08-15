import { clampDifficulty } from '@/shared/math';
import type { CurriculumBank, PickedQuestion, SubjectId } from './types';
import { SUBJECT_WEIGHTS } from './weights';

const ORDER: SubjectId[] = ['math', 'english', 'language', 'science', 'history'];

export function pickSubjectId(rng: () => number = Math.random): SubjectId {
  const roll = Math.min(99, Math.floor(rng() * 100));
  let acc = 0;
  for (const id of ORDER) {
    acc += SUBJECT_WEIGHTS[id];
    if (roll < acc) return id;
  }
  return 'history';
}

function flatten(
  bank: CurriculumBank,
  filter: (subjectId: SubjectId, difficulty: number) => boolean,
): PickedQuestion[] {
  const out: PickedQuestion[] = [];
  for (const s of bank.subjects) {
    for (const u of s.units) {
      for (const q of u.questions) {
        if (!filter(s.id, q.difficulty)) continue;
        const correctIndex = q.options.indexOf(q.correctAnswer);
        if (correctIndex < 0) continue;
        out.push({
          subjectId: s.id,
          subjectName: s.name,
          unitName: u.name,
          prompt: q.prompt,
          options: [...q.options],
          correctIndex,
          difficulty: q.difficulty,
        });
      }
    }
  }
  return out;
}

function choose<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function pickQuestion(
  bank: CurriculumBank,
  difficulty: number,
  rng: () => number = Math.random,
): PickedQuestion {
  const d = clampDifficulty(difficulty) as 1 | 2 | 3;
  const subjectId = pickSubjectId(rng);

  const pools: PickedQuestion[][] = [
    flatten(bank, (sid, diff) => sid === subjectId && diff === d),
    flatten(bank, (sid, diff) => sid === subjectId && Math.abs(diff - d) === 1),
    flatten(bank, (sid) => sid === subjectId),
    flatten(bank, (_sid, diff) => diff === d),
    flatten(bank, () => true),
  ];

  for (const pool of pools) {
    if (pool.length) return choose(pool, rng);
  }
  throw new Error('Curriculum bank has no questions');
}
