# Learning engine (curriculum quiz) — Design Spec

**Date:** 2026-08-15  
**Status:** Approved for planning  
**Backlog item:** A (after E, D, B, C)

---

## 1. Goal

Extract a **reusable learning/quiz engine** that draws multiple-choice questions from country/grade curriculum JSON, awards coin rewards by subject + difficulty, and can be opened as a game overlay window.

In the fort shooter, replace the dual math-generator / English-catalog quiz paths with **one** content-driven MCQ loop. Keep `mathGenerator` and the English catalog **in the repo unused** as a future fallback if curriculum math becomes too repetitive. Expand math items in the JSON now.

**Success:** Shop opens a single MCQ quiz; each question re-rolls subject by hardcoded weights; rewards = base × difficulty; 2 attempts per question; gem/coin streaks still work; JSON keys are English with Spanish values; Chile/2do loads cleanly.

---

## 2. Decisions (locked)

| Topic | Choice |
|-------|--------|
| Scope vs old quizzes | **Replace** shop wiring with content quiz; keep generators unused |
| Question format | Multiple choice (3 options) from JSON |
| Difficulty | Per-question `difficulty: 1 \| 2 \| 3`; overlay Más fácil / Más difícil filters pool |
| Reward | `SUBJECT_REWARD_BASE[id] × difficulty` |
| Attempts | **2** per question; fail both → 0 coins, next question |
| Subject each question | Re-roll by weights every new question |
| Weights (hardcoded constants) | math 45, english 25, language 10, science 10, history 10 |
| Reward bases | math 6, english/language/science/history 5 |
| Architecture | Domain-pure engine + thin game overlay |

---

## 3. Architecture

| Piece | Responsibility |
|-------|----------------|
| `src/domain/learning/` | Types, constants (weights + bases), load bank, pick, session (no DOM) |
| `src/domain/content_per_level/{Country}/{grade}.json` | Question bank |
| `src/game/ui/overlays/contentQuizOverlay.ts` | MCQ UI; calls learning domain; loops until Salir |
| `GameSession.openQuiz` | Wire only content overlay; drop english/math branches |
| `src/domain/math/` | **Unused by shop** (keep for later) |
| `src/domain/english/` | **Unused by shop** (keep for later) |
| Old overlays | Stop importing from GameSession; files may remain until cleanup |

### Domain API (sketch)

```typescript
loadCurriculum(country: string, grade: string): CurriculumBank
pickQuestion(bank, difficulty, rng?): PickedQuestion  // subject → unit → question
startLearningQuiz(bank, difficulty, rng?): LearningQuizState
submitChoice(state, optionIndex: number): LearningQuizState
adjustDifficulty(state, delta: -1 | 1, rng?): LearningQuizState
coinsEarned(state): number
```

`LearningQuizState` holds: subject id, difficulty, question (prompt/options/correct index), attemptsLeft (2), reward, status (`active` | `won` | `failed`), lastMessage.

---

## 4. Curriculum JSON schema

Keys **English**; display strings **Spanish**.

```json
{
  "course": "2do Básico - Sistema Educativo Chileno",
  "subjects": [
    {
      "id": "math",
      "name": "Matemática",
      "units": [
        {
          "name": "Números y Operaciones",
          "description": "...",
          "questions": [
            {
              "prompt": "...",
              "options": ["A", "B", "C"],
              "correctAnswer": "B",
              "difficulty": 1
            }
          ]
        }
      ]
    }
  ]
}
```

### Subject ids (stable)

| `id` | Display `name` (ES) | Weight | Base coins |
|------|---------------------|--------|------------|
| `math` | Matemática | 45 | 6 |
| `english` | Inglés | 25 | 5 |
| `language` | Lenguaje y Comunicación | 10 | 5 |
| `science` | Ciencias Naturales | 10 | 5 |
| `history` | Historia, Geografía y Ciencias Sociales | 10 | 5 |

Constants live in `learning/weights.ts` (weights + reward bases + score points) so they can be edited later without hunting call sites.

### File path

- Keep filename `Chile/2do_basic.json`. Loader maps grade id `2do` → file stem `2do_basic`.
- Country from profile/config default `"Chile"`; grade from profile (`2do`).

### Content work in this feature

1. Migrate existing Spanish-key JSON → English keys + `id` + `difficulty` on every question.
2. Add **at least +12** math questions (target ~24 total across both math units) at mixed difficulties.
3. Ensure every subject has questions at difficulties 1–3 where possible; if a difficulty pool is empty, **fallback**: try adjacent difficulty (±1), then any difficulty in that subject, then any subject (still respecting weights only on the primary pick path — fallback is last resort to avoid empty UI).

---

## 5. In-game flow

1. Rest/shop → player opens quiz (same entry as today).
2. Overlay starts at `save.quizDifficulty` (clamped 1–3).
3. Loop until **Salir**:
   - Pick question (weighted subject, filter by difficulty).
   - Show subject label, prompt, 3 options, visible reward, attempts left, session totals.
   - Correct → add coins/score to session totals; `onAnswerResult(true)` for gem streak; brief pause → next pick.
   - Wrong with attempts left → message, stay on same question.
   - Failed (0 attempts) → `onAnswerResult(false)`; pause → next pick (0 coins for that item).
   - **Más fácil / Más difícil** → `adjustDifficulty`, new question immediately.
4. **Salir** → apply `quizCoinsForWave(totalCoins, wave)`, existing coin streak bonus helpers, persist `quizDifficulty`, return to shop.

### Save / legacy fields

- Keep and use: `quizDifficulty`.
- Ignore for quiz wiring: `subject`, `mathTopic`, `englishGrade` (may remain on `GameSave` for online payload compat; do not branch UI on them).

### Score (stars)

- Per correct answer: flat points equal to the subject reward base (math **6**, others **5**). No random band. Do not call old `scoreForQuiz(MathTopic)`.

### Online

- Same content overlay; grade/country drive the bank. Network `subject` field does not select the quiz bank.

---

## 6. Overlay UX

- Reuse existing quiz card / button styles where practical.
- Options as large buttons (English overlay pattern), not numpad.
- Show reward **before** answering.
- Spanish copy for UI chrome (Salir, Más fácil, Más difícil, Intentos, Recompensa, messages).

---

## 7. Testing

| Area | Assert |
|------|--------|
| Weights | With fixed RNG / many trials, pick frequencies roughly match 45/25/10/10/10 |
| Difficulty filter | Picked question has requested difficulty when pool non-empty |
| Fallback | Empty pool does not throw; returns a valid question |
| Session | 2 attempts; win pays `base × diff`; fail pays 0 |
| Schema | Chile/2do JSON parses into typed bank |
| Integration | `openQuiz` uses content overlay only (no english/math branch) |

---

## 8. Out of scope (v1)

- Admin UI for weights or content editing
- Additional countries/grades beyond Chile/2do (structure must allow them)
- Re-enabling `mathGenerator` as a live source
- Deleting unused math/english modules or old overlay files (optional later cleanup)
- Changing gem streak rules (already shipped in C)

---

## 9. Implementation notes

- Prefer Vite JSON import or static import map for the Chile/2do bank in v1.
- Keep learning domain free of `GameSession` / Three.js imports.
- When both fix and any temporary debug harnesses appear, ship only production paths.

---

## 10. Acceptance checklist

- [ ] JSON keys English; values Spanish; all subjects have `id`
- [ ] Every question has `difficulty` 1–3
- [ ] Math question count ≥ ~24
- [ ] Weights and bases are named constants in `learning/`
- [ ] Single shop quiz path; 2 attempts; reward = base × difficulty
- [ ] Gem quiz streak still increments/resets via `onAnswerResult`
- [ ] `mathGenerator` / english catalog not imported from GameSession
- [ ] Vitest coverage for pick + session + schema load
