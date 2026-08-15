import chile2do from '@/domain/content_per_level/Chile/2do_basic.json';
import type { CurriculumBank, SubjectId } from './types';

const GRADE_FILE: Record<string, string> = {
  '2do': '2do_basic',
};

const REGISTRY: Record<string, CurriculumBank> = {
  'Chile/2do_basic': chile2do as CurriculumBank,
};

const SUBJECT_IDS: SubjectId[] = ['math', 'english', 'language', 'science', 'history'];

function assertBank(bank: CurriculumBank): CurriculumBank {
  if (!bank?.subjects?.length) throw new Error('Curriculum bank is empty');
  for (const s of bank.subjects) {
    if (!SUBJECT_IDS.includes(s.id)) throw new Error(`Unknown subject id: ${s.id}`);
    for (const u of s.units) {
      for (const q of u.questions) {
        if (q.options.length < 2) throw new Error(`Bad options: ${q.prompt}`);
        if (!q.options.includes(q.correctAnswer)) {
          throw new Error(`correctAnswer not in options: ${q.prompt}`);
        }
        if (q.difficulty !== 1 && q.difficulty !== 2 && q.difficulty !== 3) {
          throw new Error(`Bad difficulty: ${q.prompt}`);
        }
      }
    }
  }
  return bank;
}

export function loadCurriculum(country: string, grade: string): CurriculumBank {
  const stem = GRADE_FILE[grade];
  if (!stem) throw new Error(`No curriculum file mapping for grade: ${grade}`);
  const key = `${country}/${stem}`;
  const bank = REGISTRY[key];
  if (!bank) throw new Error(`No curriculum registered for ${key}`);
  return assertBank(bank);
}
