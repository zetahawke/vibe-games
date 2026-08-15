# Learning Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Curriculum-driven MCQ learning engine (domain + overlay) that replaces the shop’s math/english quiz paths, with weighted subjects, per-question difficulty, and expanded Chile/2do math content.

**Architecture:** Pure `src/domain/learning/` (weights, load bank, pick, session). Vite-imported JSON under `content_per_level`. Thin `contentQuizOverlay` for UI. `GameSession.openQuiz` wires only the new overlay; keep `math/` and `english/` modules unused.

**Tech Stack:** TypeScript, Vite JSON import, Vitest, existing DOM overlay helpers (`el`, `makeOverlayCard`)

## Global Constraints

- Subject weights: math **45**, english **25**, language **10**, science **10**, history **10** (constants in `learning/weights.ts`).
- Reward bases: math **6**, others **5**; coins = base × difficulty (1–3).
- Score stars: same as bases (math **6**, others **5**) per correct answer.
- **2** attempts per question; fail → 0 coins for that item.
- Re-roll subject by weights on **every** new question.
- JSON keys English; values Spanish; file stays `Chile/2do_basic.json`; loader maps grade `2do` → `2do_basic`.
- Keep `mathGenerator` / english catalog in repo; do not import them from `GameSession`.
- `npx vitest run` green after each task; `npx tsc --noEmit` before handoff.

**Spec:** `docs/superpowers/specs/2026-08-15-learning-engine-design.md`

---

## File map

| File | Role |
|------|------|
| `src/domain/learning/types.ts` | Curriculum + session types |
| `src/domain/learning/weights.ts` | Weights, reward bases, score points, attempts |
| `src/domain/learning/loadCurriculum.ts` | Map country/grade → bank; validate |
| `src/domain/learning/pickQuestion.ts` | Weighted pick + difficulty filter + fallback |
| `src/domain/learning/session.ts` | start / submitChoice / adjustDifficulty / coinsEarned |
| `src/domain/learning/index.ts` | Public exports |
| `src/domain/content_per_level/Chile/2do_basic.json` | Migrated + expanded bank |
| `src/game/ui/overlays/contentQuizOverlay.ts` | MCQ loop UI |
| `src/game/GameSession.ts` | `openQuiz` → content overlay only |
| `tsconfig.json` | `resolveJsonModule: true` |
| `tests/learningWeights.test.ts` | Constants |
| `tests/learningPick.test.ts` | Pick / weights / fallback |
| `tests/learningSession.test.ts` | Attempts / rewards |
| `tests/learningCurriculum.test.ts` | JSON loads + schema |

**Leave unused (no delete):** `src/domain/math/*`, `src/domain/english/*`, `quizOverlay.ts`, `englishQuizOverlay.ts`, `quizSession.ts` (old math session may stay; new code uses `learning/session.ts`).

---

### Task 1: Types + weights constants (TDD)

**Files:**
- Create: `src/domain/learning/types.ts`
- Create: `src/domain/learning/weights.ts`
- Create: `src/domain/learning/index.ts`
- Create: `tests/learningWeights.test.ts`
- Modify: `tsconfig.json` (add `"resolveJsonModule": true`)

**Interfaces:**
- Produces:
  - `SubjectId = 'math' | 'english' | 'language' | 'science' | 'history'`
  - `SUBJECT_WEIGHTS: Record<SubjectId, number>`
  - `SUBJECT_REWARD_BASE: Record<SubjectId, number>`
  - `SUBJECT_SCORE: Record<SubjectId, number>`
  - `LEARNING_QUIZ_ATTEMPTS = 2`
  - Types: `CurriculumQuestion`, `CurriculumUnit`, `CurriculumSubject`, `CurriculumBank`, `PickedQuestion`, `LearningQuizState`

- [ ] **Step 1: Write failing test**

```typescript
// tests/learningWeights.test.ts
import { describe, expect, it } from 'vitest';
import {
  LEARNING_QUIZ_ATTEMPTS,
  SUBJECT_REWARD_BASE,
  SUBJECT_SCORE,
  SUBJECT_WEIGHTS,
} from '@/domain/learning/weights';

describe('learning weights', () => {
  it('matches locked spawn weights', () => {
    expect(SUBJECT_WEIGHTS).toEqual({
      math: 45,
      english: 25,
      language: 10,
      science: 10,
      history: 10,
    });
    expect(Object.values(SUBJECT_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('matches reward bases and score points', () => {
    expect(SUBJECT_REWARD_BASE.math).toBe(6);
    expect(SUBJECT_REWARD_BASE.english).toBe(5);
    expect(SUBJECT_REWARD_BASE.language).toBe(5);
    expect(SUBJECT_REWARD_BASE.science).toBe(5);
    expect(SUBJECT_REWARD_BASE.history).toBe(5);
    expect(SUBJECT_SCORE).toEqual(SUBJECT_REWARD_BASE);
  });

  it('uses 2 attempts', () => {
    expect(LEARNING_QUIZ_ATTEMPTS).toBe(2);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (module missing)**

```bash
npx vitest run tests/learningWeights.test.ts
```

- [ ] **Step 3: Implement types + weights + index; enable JSON modules**

```typescript
// src/domain/learning/types.ts
export type SubjectId = 'math' | 'english' | 'language' | 'science' | 'history';

export interface CurriculumQuestion {
  prompt: string;
  options: string[];
  correctAnswer: string;
  difficulty: 1 | 2 | 3;
}

export interface CurriculumUnit {
  name: string;
  description: string;
  questions: CurriculumQuestion[];
}

export interface CurriculumSubject {
  id: SubjectId;
  name: string;
  units: CurriculumUnit[];
}

export interface CurriculumBank {
  course: string;
  subjects: CurriculumSubject[];
}

export interface PickedQuestion {
  subjectId: SubjectId;
  subjectName: string;
  unitName: string;
  prompt: string;
  options: string[];
  /** Index into options that matches correctAnswer */
  correctIndex: number;
  difficulty: 1 | 2 | 3;
}

export interface LearningQuizState {
  bank: CurriculumBank;
  subjectId: SubjectId;
  subjectName: string;
  difficulty: number;
  question: PickedQuestion;
  attemptsLeft: number;
  reward: number;
  status: 'active' | 'won' | 'failed';
  lastMessage: string;
}
```

```typescript
// src/domain/learning/weights.ts
import type { SubjectId } from './types';

export const SUBJECT_WEIGHTS: Record<SubjectId, number> = {
  math: 45,
  english: 25,
  language: 10,
  science: 10,
  history: 10,
};

export const SUBJECT_REWARD_BASE: Record<SubjectId, number> = {
  math: 6,
  english: 5,
  language: 5,
  science: 5,
  history: 5,
};

export const SUBJECT_SCORE: Record<SubjectId, number> = { ...SUBJECT_REWARD_BASE };

export const LEARNING_QUIZ_ATTEMPTS = 2;
```

```typescript
// src/domain/learning/index.ts
export * from './types';
export * from './weights';
```

In `tsconfig.json` `compilerOptions`, add: `"resolveJsonModule": true`.

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run tests/learningWeights.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add tsconfig.json src/domain/learning tests/learningWeights.test.ts
git commit -m "Add learning engine types and subject weight constants."
```

---

### Task 2: Migrate curriculum JSON + loader (TDD)

**Files:**
- Modify: `src/domain/content_per_level/Chile/2do_basic.json` (full rewrite to English keys)
- Create: `src/domain/learning/loadCurriculum.ts`
- Modify: `src/domain/learning/index.ts`
- Create: `tests/learningCurriculum.test.ts`

**Interfaces:**
- Consumes: `CurriculumBank`, `SubjectId`
- Produces: `loadCurriculum(country: string, grade: string): CurriculumBank`
- Grade map: `'2do'` → file `2do_basic.json` under country folder
- v1: only `Chile` + `2do` registered; unknown → throw clear Error

- [ ] **Step 1: Write failing curriculum test**

```typescript
// tests/learningCurriculum.test.ts
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
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run tests/learningCurriculum.test.ts
```

- [ ] **Step 3: Rewrite JSON**

Transform the existing Spanish-key file into English keys:

| Old | New |
|-----|-----|
| `curso` | `course` |
| `materias` | `subjects` |
| `asignatura` | `name` (+ add `id`) |
| `subcontenidos` | `units` |
| `nombre` | `name` |
| `descripcion` | `description` |
| `preguntas` | `questions` |
| `pregunta` | `prompt` |
| `alternativas` | `options` |
| `respuesta_correcta` | `correctAnswer` |

Subject `id` mapping by Spanish name:

| name contains / equals | id |
|------------------------|-----|
| Matemática | `math` |
| Inglés | `english` |
| Lenguaje | `language` |
| Ciencias Naturales | `science` |
| Historia | `history` |

Assign `difficulty` per question (spread 1–3 within each unit). Heuristic if bulk-converting: first third of each unit → 1, middle → 2, last → 3; then hand-tune obvious easy/hard items.

**Add at least 12 new math questions** (6 per unit). Suggested additions (copy into JSON with difficulties):

**Números y Operaciones** (add, mix diff 1–3):

1. `¿Cuánto es 8 + 7?` → options `14,15,16` correct `15` diff 1  
2. `¿Cuánto es 30 - 12?` → `18,22,12` → `18` diff 1  
3. `¿Qué número está entre 20 y 22?` → `19,21,23` → `21` diff 1  
4. `Si tengo 9 y gano 6, ¿cuántos tengo?` → `15,3,16` → `15` diff 2  
5. `¿Cuánto es 25 + 25?` → `40,50,55` → `50` diff 2  
6. `Completa: 100 - 40 = ?` → `50,60,70` → `60` diff 2  
7. (optional 7th if needed) `¿Cuál es el doble de 6?` → `10,12,14` → `12` diff 2  

**Datos y Geometría** (add):

1. `¿Cuántos lados tiene un cuadrado?` → `3,4,5` → `4` diff 1  
2. `¿Cuántos vértices tiene un triángulo?` → `2,3,4` → `3` diff 1  
3. `Una pelota se parece a una…` → `cubo,esfera,pirámide` → `esfera` diff 1  
4. `Si cada carita vale 5 y hay 2 caritas, ¿cuántos puntos?` → `7,10,5` → `10` diff 2  
5. `¿Qué figura tiene 3 lados?` → `cuadrado,triángulo,círculo` → `triángulo` diff 1  
6. `Un dado se parece a un…` → `cilindro,cubo,cono` → `cubo` diff 2  

Ensure math total ≥ 24 after merge (12 existing + ≥12 new).

Keep all other subjects’ questions; only rename keys + add `id` + `difficulty`.

- [ ] **Step 4: Implement loader**

```typescript
// src/domain/learning/loadCurriculum.ts
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
```

Export from `index.ts`.

- [ ] **Step 5: Run tests — PASS**

```bash
npx vitest run tests/learningCurriculum.test.ts tests/learningWeights.test.ts
```

- [ ] **Step 6: Commit** (include JSON + loader)

```bash
git add src/domain/content_per_level src/domain/learning tests/learningCurriculum.test.ts
git commit -m "Migrate Chile 2do curriculum JSON and add loadCurriculum."
```

---

### Task 3: pickQuestion (TDD)

**Files:**
- Create: `src/domain/learning/pickQuestion.ts`
- Create: `tests/learningPick.test.ts`
- Modify: `src/domain/learning/index.ts`

**Interfaces:**
- Consumes: `CurriculumBank`, `SUBJECT_WEIGHTS`, `clampDifficulty` from `@/shared/math`
- Produces:
  - `pickSubjectId(rng: () => number): SubjectId`
  - `pickQuestion(bank, difficulty, rng?): PickedQuestion`

Fallback order when filtered pool empty:
1. Same subject, difficulty ±1  
2. Same subject, any difficulty  
3. Any subject, requested difficulty  
4. Any question in bank  

`correctIndex` = `options.indexOf(correctAnswer)`.

- [ ] **Step 1: Write tests**

```typescript
// tests/learningPick.test.ts
import { describe, expect, it } from 'vitest';
import { loadCurriculum } from '@/domain/learning/loadCurriculum';
import { pickQuestion, pickSubjectId } from '@/domain/learning/pickQuestion';
import { SUBJECT_WEIGHTS } from '@/domain/learning/weights';

describe('pickQuestion', () => {
  const bank = loadCurriculum('Chile', '2do');

  it('pickSubjectId respects weight bands with fixed rng', () => {
    // Cumulative: math 0-44, english 45-69, language 70-79, science 80-89, history 90-99
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
    // With uniform 0.00..0.99 cycling, expect exact weight counts
    expect(counts.math).toBe(SUBJECT_WEIGHTS.math * 10);
    expect(counts.english).toBe(SUBJECT_WEIGHTS.english * 10);
  });
});
```

Note: Adjust the distribution test if `pickSubjectId` uses `Math.floor(rng() * 100)` — with `k/100` for k=0..99 repeated 10×, counts should match weights × 10. Ensure `rng() === 1` never happens (use `min(99, floor(rng()*100))`).

- [ ] **Step 2: Run — FAIL**

```bash
npx vitest run tests/learningPick.test.ts
```

- [ ] **Step 3: Implement pickQuestion.ts**

```typescript
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
```

- [ ] **Step 4: Run — PASS** (tweak rng band tests if off-by-one)

```bash
npx vitest run tests/learningPick.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/domain/learning/pickQuestion.ts tests/learningPick.test.ts src/domain/learning/index.ts
git commit -m "Add weighted curriculum question picker."
```

---

### Task 4: Learning quiz session (TDD)

**Files:**
- Create: `src/domain/learning/session.ts`
- Create: `tests/learningSession.test.ts`
- Modify: `src/domain/learning/index.ts`

**Interfaces:**
- Produces:
  - `startLearningQuiz(bank, difficulty, rng?): LearningQuizState`
  - `submitChoice(state, optionIndex: number): LearningQuizState`
  - `adjustDifficulty(state, delta: -1 | 1, rng?): LearningQuizState`
  - `coinsEarned(state): number`
  - `scoreForSubject(subjectId): number` → `SUBJECT_SCORE[id]`

Behavior mirrors old quizSession but MCQ + 2 attempts:
- Correct → `status: 'won'`, message `¡Correcto!`
- Wrong → decrement attempts; if 0 → `failed`, message about no attempts; else keep `active` with remaining message
- `reward` = `SUBJECT_REWARD_BASE[subjectId] * clampDifficulty(difficulty)` set at start (from picked question’s subject)
- `adjustDifficulty` → `startLearningQuiz` with new difficulty
- `coinsEarned` → reward if won else 0

- [ ] **Step 1: Write tests**

```typescript
// tests/learningSession.test.ts
import { describe, expect, it } from 'vitest';
import { loadCurriculum } from '@/domain/learning/loadCurriculum';
import {
  adjustDifficulty,
  coinsEarned,
  startLearningQuiz,
  submitChoice,
} from '@/domain/learning/session';
import { LEARNING_QUIZ_ATTEMPTS, SUBJECT_REWARD_BASE } from '@/domain/learning/weights';

describe('learning session', () => {
  const bank = loadCurriculum('Chile', '2do');
  const rng = () => 0.01; // bias math / early options

  it('starts with 2 attempts and positive reward', () => {
    const s = startLearningQuiz(bank, 2, rng);
    expect(s.attemptsLeft).toBe(LEARNING_QUIZ_ATTEMPTS);
    expect(s.status).toBe('active');
    expect(s.reward).toBe(SUBJECT_REWARD_BASE[s.subjectId] * 2);
  });

  it('wins on correct choice', () => {
    const s0 = startLearningQuiz(bank, 1, rng);
    const s1 = submitChoice(s0, s0.question.correctIndex);
    expect(s1.status).toBe('won');
    expect(coinsEarned(s1)).toBe(s1.reward);
  });

  it('fails after 2 wrong answers', () => {
    const s0 = startLearningQuiz(bank, 1, rng);
    const wrong = s0.question.correctIndex === 0 ? 1 : 0;
    const s1 = submitChoice(s0, wrong);
    expect(s1.status).toBe('active');
    expect(s1.attemptsLeft).toBe(1);
    const s2 = submitChoice(s1, wrong);
    expect(s2.status).toBe('failed');
    expect(coinsEarned(s2)).toBe(0);
  });

  it('adjustDifficulty reclamps and picks new question', () => {
    const s0 = startLearningQuiz(bank, 1, rng);
    const s1 = adjustDifficulty(s0, -1, rng);
    expect(s1.difficulty).toBe(1);
    const s2 = adjustDifficulty(s0, 1, rng);
    expect(s2.difficulty).toBe(2);
  });
});
```

- [ ] **Step 2: Run — FAIL**

```bash
npx vitest run tests/learningSession.test.ts
```

- [ ] **Step 3: Implement session.ts** (use pickQuestion; LEARNING_QUIZ_ATTEMPTS; Spanish messages like existing quiz)

- [ ] **Step 4: Run — PASS**

```bash
npx vitest run tests/learningSession.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/domain/learning/session.ts tests/learningSession.test.ts src/domain/learning/index.ts
git commit -m "Add learning quiz session with two attempts."
```

---

### Task 5: contentQuizOverlay UI

**Files:**
- Create: `src/game/ui/overlays/contentQuizOverlay.ts`

**Interfaces:**
- Consumes: `loadCurriculum`, `startLearningQuiz`, `submitChoice`, `adjustDifficulty`, `coinsEarned`, `SUBJECT_SCORE`
- Produces:
  ```typescript
  renderContentQuizOverlay(
    parent: HTMLElement,
    country: string,
    grade: string, // ChileGrade string e.g. '2do'
    difficulty: number,
    onExit: (coins: number, score: number, finalDifficulty: number) => void,
    onAnswerResult?: (correct: boolean) => void,
  ): HTMLElement
  ```

- [ ] **Step 1: Implement overlay** (pattern from `englishQuizOverlay.ts` + easier/harder/exit from `quizOverlay.ts`)

Behavior:
- `const bank = loadCurriculum(country, grade)` once
- Loop: show subject name, prompt, reward, attempts, message, option buttons, Más fácil / Más difícil / Salir
- On option click: `submitChoice`; if won → add `coinsEarned` + `SUBJECT_SCORE[subjectId]` to totals, `onAnswerResult?.(true)`, pause ~900ms, `startLearningQuiz` again; if failed → `onAnswerResult?.(false)`, pause ~1200ms, next; if still active → re-render
- Disable option buttons while `status !== 'active'`
- Exit → `onExit(totalCoins, totalScore, state.difficulty)`

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/game/ui/overlays/contentQuizOverlay.ts
git commit -m "Add content quiz overlay for curriculum MCQs."
```

---

### Task 6: Wire GameSession.openQuiz

**Files:**
- Modify: `src/game/GameSession.ts` (`openQuiz` method ~237–300)

**Interfaces:**
- Consumes: `renderContentQuizOverlay`
- Country: hardcode `'Chile'` for v1 (or read from profile if a country field exists; otherwise `'Chile'`)
- Grade: `this.save.grade` (already Chile grade id)

- [ ] **Step 1: Replace `openQuiz` body**

Remove branches for `renderEnglishQuizOverlay` / `renderQuizOverlay`. Single path:

```typescript
private openQuiz(): void {
  this.shopOverlay?.remove();
  this.shopOverlay = null;

  this.quizOverlay = renderContentQuizOverlay(
    this.wrap,
    'Chile',
    this.save.grade,
    this.save.quizDifficulty,
    (coins, score, finalDifficulty) => {
      const scaledCoins = quizCoinsForWave(coins, this.waves.wave);
      this.save.coins = addCoins(this.save.coins, scaledCoins);
      this.save.quizStreak += 1;
      const bonus = streakBonusCoins(this.save.coins, this.save.quizStreak);
      if (bonus > 0) {
        this.save.coins = addCoins(this.save.coins, bonus);
        this.showBanner(`🎉 ¡Racha! +${bonus} monedas`);
      }
      this.save.score += score;
      this.save.quizDifficulty = finalDifficulty;
      this.persist();
      this.quizOverlay?.remove();
      this.quizOverlay = null;
      this.requestShop();
    },
    (correct) => {
      if (correct) this.awardGemFromStreak('quiz');
      else this.quizGemStreak = resetStreak();
    },
  );
}
```

Update imports: drop old quiz overlays; add `renderContentQuizOverlay`.

Note: On **Salir**, current math overlay still bumps `quizStreak` even with 0 coins earned in session — preserve that behavior for coin streak, or only increment if `coins > 0`. **Preserve existing math path behavior** (always increment on exit as today) unless clearly wrong; mirror the math branch above exactly.

Also: when user exits without answering, math path still increments quizStreak — keep same.

- [ ] **Step 2: Confirm no remaining GameSession imports of english/math quiz**

```bash
rg "renderQuizOverlay|renderEnglishQuizOverlay|pickEnglishQuestion|generateQuestion" src/game/GameSession.ts
```

Expected: no matches.

- [ ] **Step 3: Run full tests + tsc**

```bash
npx vitest run && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/game/GameSession.ts
git commit -m "Wire shop quiz to curriculum learning overlay."
```

---

### Task 7: Verification + handoff

- [ ] **Step 1: Acceptance from spec**

Manually check or assert via tests:
- [ ] JSON English keys; Spanish values; subject ids
- [ ] Math ≥ 24 questions
- [ ] Weights/bases constants in `weights.ts`
- [ ] Single shop quiz path; 2 attempts; reward base × difficulty
- [ ] Gem callback still wired
- [ ] math/english not imported from GameSession

- [ ] **Step 2: Final commands**

```bash
npx vitest run
npx tsc --noEmit
```

- [ ] **Step 3: Optional smoke** — `npm run dev`, open shop quiz, answer one easy/hard, Salir, confirm coins.

- [ ] **Step 4: Final commit only if leftover fixes**; otherwise done.

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| Domain learning module | 1–4 |
| English-key JSON + Chile/2do loader | 2 |
| Extra math questions | 2 |
| Weights / bases constants | 1 |
| pick + fallback | 3 |
| Session 2 attempts + reward | 4 |
| Overlay MCQ | 5 |
| GameSession single path | 6 |
| Keep generators unused | 6 (no imports) |
| Tests | 1–4, 7 |
| Score = bases | 4–5 (`SUBJECT_SCORE`) |

No TBD placeholders. Types consistent across tasks (`SubjectId`, `CurriculumBank`, `LearningQuizState`, `PickedQuestion`).
