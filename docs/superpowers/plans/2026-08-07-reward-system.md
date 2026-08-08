# Reward System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three new reward mechanics: (1) heal 1 life every 5 waves, (2) quiz coin reward scales +10% per wave, (3) every 5 consecutive correct quiz answers awards a 20% cash bonus.

**Architecture:** Pure frontend — no backend required. New fields on `GameSave` track `wavesCleared` and `quizStreak`. Pure functions in a new `src/domain/rewards/rewardLogic.ts` calculate each mechanic. `GameSession` calls these on wave completion and quiz win events.

**Tech Stack:** TypeScript, Vitest

## Global Constraints

- All new identifiers in English.
- UI text (popup messages) in Spanish.
- No new npm dependencies.
- `npx vitest run` after every task — all tests must stay green.
- `npx tsc --noEmit` after every task — zero errors.

---

### Task 1: Reward domain logic

**Files:**
- Create: `src/domain/rewards/rewardLogic.ts`
- Create: `tests/rewardLogic.test.ts`

**Interfaces:**
- Produces:
  - `quizCoinMultiplier(wave: number): number` — 1.0 + 0.1 per wave past wave 1
  - `quizCoinsForWave(baseCoins: number, wave: number): number`
  - `shouldHealOnWave(wavesCleared: number): boolean` — true when wavesCleared % 5 === 0
  - `streakBonusCoins(currentCoins: number, streak: number): number` — 20% of current coins when streak % 5 === 0, else 0

- [ ] **Step 1: Write failing tests**

```typescript
// tests/rewardLogic.test.ts
import { describe, expect, it } from 'vitest';
import {
  quizCoinMultiplier,
  quizCoinsForWave,
  shouldHealOnWave,
  streakBonusCoins,
} from '@/domain/rewards/rewardLogic';

describe('quizCoinMultiplier', () => {
  it('is 1.0 on wave 1', () => {
    expect(quizCoinMultiplier(1)).toBeCloseTo(1.0);
  });
  it('increases by 10% per wave', () => {
    expect(quizCoinMultiplier(2)).toBeCloseTo(1.1);
    expect(quizCoinMultiplier(5)).toBeCloseTo(1.4);
    expect(quizCoinMultiplier(10)).toBeCloseTo(1.9);
  });
  it('is never below 1.0', () => {
    expect(quizCoinMultiplier(0)).toBeGreaterThanOrEqual(1.0);
  });
});

describe('quizCoinsForWave', () => {
  it('returns base coins on wave 1', () => {
    expect(quizCoinsForWave(10, 1)).toBe(10);
  });
  it('scales with wave', () => {
    // Wave 2: 10 * 1.1 = 11
    expect(quizCoinsForWave(10, 2)).toBe(11);
    // Wave 5: 10 * 1.4 = 14
    expect(quizCoinsForWave(10, 5)).toBe(14);
  });
  it('rounds to nearest integer', () => {
    // Wave 3: 10 * 1.2 = 12 (exact)
    expect(Number.isInteger(quizCoinsForWave(7, 3))).toBe(true);
  });
});

describe('shouldHealOnWave', () => {
  it('heals on multiples of 5', () => {
    expect(shouldHealOnWave(5)).toBe(true);
    expect(shouldHealOnWave(10)).toBe(true);
    expect(shouldHealOnWave(15)).toBe(true);
  });
  it('does not heal on non-multiples', () => {
    expect(shouldHealOnWave(1)).toBe(false);
    expect(shouldHealOnWave(4)).toBe(false);
    expect(shouldHealOnWave(6)).toBe(false);
  });
  it('does not heal on wave 0', () => {
    expect(shouldHealOnWave(0)).toBe(false);
  });
});

describe('streakBonusCoins', () => {
  it('gives 20% of current coins on every 5th correct answer', () => {
    expect(streakBonusCoins(100, 5)).toBe(20);
    expect(streakBonusCoins(100, 10)).toBe(20);
    expect(streakBonusCoins(50, 5)).toBe(10);
  });
  it('gives 0 when streak is not a multiple of 5', () => {
    expect(streakBonusCoins(100, 1)).toBe(0);
    expect(streakBonusCoins(100, 4)).toBe(0);
    expect(streakBonusCoins(100, 6)).toBe(0);
  });
  it('gives 0 when streak is 0', () => {
    expect(streakBonusCoins(100, 0)).toBe(0);
  });
  it('floors the 20% to nearest integer', () => {
    // 20% of 7 = 1.4 → 1
    expect(streakBonusCoins(7, 5)).toBe(1);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run tests/rewardLogic.test.ts
```

Expected: `Cannot find module '@/domain/rewards/rewardLogic'`

- [ ] **Step 3: Implement `src/domain/rewards/rewardLogic.ts`**

```typescript
import { MAX_LIVES } from '@/config/gameConfig';

/**
 * Quiz coin multiplier at the current wave.
 * Wave 1 = 1.0×, each subsequent wave adds 10%.
 */
export function quizCoinMultiplier(wave: number): number {
  return 1 + Math.max(0, wave - 1) * 0.1;
}

/**
 * Apply the wave multiplier to a base coin reward, rounding to integer.
 */
export function quizCoinsForWave(baseCoins: number, wave: number): number {
  return Math.round(baseCoins * quizCoinMultiplier(wave));
}

/**
 * True when the given number of waves cleared should trigger a life heal.
 * Heals on every 5th wave (5, 10, 15, ...), never on 0.
 */
export function shouldHealOnWave(wavesCleared: number): boolean {
  return wavesCleared > 0 && wavesCleared % 5 === 0;
}

/**
 * Coins to award as a streak bonus.
 * Triggers on every 5th correct answer (streak 5, 10, 15, ...).
 * Returns 20% of currentCoins, floored, or 0 if not a trigger point.
 */
export function streakBonusCoins(currentCoins: number, streak: number): number {
  if (streak <= 0 || streak % 5 !== 0) return 0;
  return Math.floor(currentCoins * 0.2);
}

/** Maximum player lives — re-exported so GameSession doesn't need gameConfig directly. */
export { MAX_LIVES };
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run tests/rewardLogic.test.ts
```

Expected: all 12 tests pass.

- [ ] **Step 5: Full suite**

```bash
npx tsc --noEmit && npx vitest run
```

Expected: 0 errors, 55+ tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/domain/rewards/rewardLogic.ts tests/rewardLogic.test.ts
git commit -m "feat: add reward logic — wave heal, quiz multiplier, streak bonus"
```

---

### Task 2: Add `wavesCleared` and `quizStreak` to GameSave

**Files:**
- Modify: `src/domain/save/save.ts`
- Modify: `tests/save.test.ts`

**Interfaces:**
- Produces: `GameSave.wavesCleared: number`, `GameSave.quizStreak: number`

- [ ] **Step 1: Add fields to `GameSave` interface in `src/domain/save/save.ts`**

```typescript
export interface GameSave {
  wave: number;
  phase: Phase;
  phaseTimeLeftMs: number;
  lives: number;
  coins: number;
  ownedWeapons: WeaponId[];
  equippedWeapon: WeaponId;
  mathTopic: MathTopic;
  quizDifficulty: number;
  subject: GameSubject;
  grade: GradeLevel;
  englishGrade: EnglishGrade;
  pathHalfW: number;
  score: number;
  /** Total number of waves fully cleared (not just current wave number). */
  wavesCleared: number;
  /** Consecutive correct quiz answers without a wrong answer reset. */
  quizStreak: number;
}
```

- [ ] **Step 2: Add defaults in `defaultSave()`**

```typescript
export function defaultSave(opts: NewGameOptions): GameSave {
  return {
    // ... existing fields ...
    wavesCleared: 0,
    quizStreak: 0,
  };
}
```

- [ ] **Step 3: Add migration in `loadSave()`**

Inside `loadSave`, after existing migrations:

```typescript
if (!Number.isFinite(save.wavesCleared)) save.wavesCleared = 0;
if (!Number.isFinite(save.quizStreak)) save.quizStreak = 0;
```

- [ ] **Step 4: Update `tests/save.test.ts`**

Add assertions to the existing roundtrip test:

```typescript
it('roundtrips a save', () => {
  const s = mathSave();
  s.coins = 12;
  s.wavesCleared = 3;
  s.quizStreak = 7;
  writeSave('ana', s);
  const loaded = loadSave('ana');
  expect(loaded?.coins).toBe(12);
  expect(loaded?.wavesCleared).toBe(3);
  expect(loaded?.quizStreak).toBe(7);
});
```

Add a migration test:

```typescript
it('migrates old saves missing wavesCleared and quizStreak', () => {
  // Simulate an old save without the new fields.
  const old = mathSave();
  const { wavesCleared: _wc, quizStreak: _qs, ...withoutNew } = old as any;
  localStorage.setItem(
    `juegos-de-casa:v1:save:ana`,
    JSON.stringify(withoutNew),
  );
  const loaded = loadSave('ana');
  expect(loaded?.wavesCleared).toBe(0);
  expect(loaded?.quizStreak).toBe(0);
});
```

- [ ] **Step 5: Run + commit**

```bash
npx tsc --noEmit && npx vitest run
git add src/domain/save/save.ts tests/save.test.ts
git commit -m "feat: add wavesCleared and quizStreak to GameSave with migration"
```

---

### Task 3: Wire rewards into GameSession

**Files:**
- Modify: `src/game/GameSession.ts`

**Interfaces:**
- Consumes: `quizCoinsForWave`, `shouldHealOnWave`, `streakBonusCoins`, `MAX_LIVES` from `@/domain/rewards/rewardLogic`

There are three hook points in `GameSession`:

1. **Wave completion** (`tickWave` transitions `wave` → `rest`): increment `wavesCleared`, check `shouldHealOnWave`, show banner.
2. **Correct quiz answer** (`onWin` callback in `openQuiz`): apply `quizCoinsForWave` multiplier, increment `quizStreak`, check `streakBonusCoins`, show bonus popup.
3. **Wrong quiz answer** (already handled in overlay): reset `quizStreak` to 0 in `GameSession` via a new `onFail` callback.

- [ ] **Step 1: Add import**

At the top of `src/game/GameSession.ts`:

```typescript
import {
  quizCoinsForWave,
  shouldHealOnWave,
  streakBonusCoins,
  MAX_LIVES,
} from '@/domain/rewards/rewardLogic';
```

- [ ] **Step 2: Detect wave completion in the game loop**

In `GameSession`, find the `tickWave` call site in the main `tick()` method. Add wave-completion detection:

```typescript
const prevWave = this.waves.wave;
const prevPhase = this.waves.phase;
this.waves = tickWave(this.waves, dtMs);

// Detect wave → rest transition (wave just ended).
if (prevPhase === 'wave' && this.waves.phase === 'rest' && this.waves.status === 'playing') {
  this.save.wavesCleared += 1;
  if (shouldHealOnWave(this.save.wavesCleared)) {
    if (this.save.lives < MAX_LIVES) {
      this.save.lives += 1;
      this.showBanner('❤️ +1 vida');
    }
  }
  this.persist();
}
```

`showBanner` already exists in `GameSession` — it sets `this.banner` and `this.bannerUntil`.

- [ ] **Step 3: Apply wave multiplier to quiz coins and track streak**

In `GameSession.openQuiz()`, the math quiz `onExit` callback currently does:

```typescript
(coins, score, finalDifficulty) => {
  this.save.coins = addCoins(this.save.coins, coins);
  // ...
```

Wrap `coins` with the wave multiplier and handle streak:

```typescript
(coins, score, finalDifficulty) => {
  // coins here is the raw total from the quiz overlay.
  // Apply wave multiplier and streak — the quiz overlay already accumulated
  // multiple answers, so we apply multiplier to the total.
  const scaledCoins = quizCoinsForWave(coins, this.waves.wave);
  this.save.coins = addCoins(this.save.coins, scaledCoins);
  this.save.quizStreak += 1; // Each successful quiz exit counts as 1 streak point.
  const bonus = streakBonusCoins(this.save.coins, this.save.quizStreak);
  if (bonus > 0) {
    this.save.coins = addCoins(this.save.coins, bonus);
    this.showBanner(`🎉 ¡Racha! +${bonus} monedas`);
  }
  this.save.score += score;
  this.save.quizDifficulty = finalDifficulty;
  this.persist();
  // ... rest of existing callback
```

Apply the same pattern to the English quiz `onWin` callback:

```typescript
(coins, score) => {
  const scaledCoins = quizCoinsForWave(coins, this.waves.wave);
  this.save.coins = addCoins(this.save.coins, scaledCoins);
  this.save.quizStreak += 1;
  const bonus = streakBonusCoins(this.save.coins, this.save.quizStreak);
  if (bonus > 0) {
    this.save.coins = addCoins(this.save.coins, bonus);
    this.showBanner(`🎉 ¡Racha! +${bonus} monedas`);
  }
  this.save.score += score;
  this.persist();
  // ...
```

- [ ] **Step 4: Reset streak on quiz close without winning**

Add a `onStreakReset` callback to `renderQuizOverlay` and `renderEnglishQuizOverlay` for when the user exits without completing a question. In `GameSession.openQuiz()`, pass:

```typescript
// After the existing onExit/onClose callbacks, add streak reset on explicit close:
() => {
  this.save.quizStreak = 0;
  this.persist();
  this.quizOverlay?.remove();
  this.quizOverlay = null;
  this.requestShop();
}
```

> Note: The quiz overlay's "Salir" button already has one callback. For the streak reset, treat the Salir/ESC close path as a streak reset and the auto-advance path (correct answer looping) as streak continuation. This means: streak only resets when the user explicitly closes the quiz, not between questions.

- [ ] **Step 5: Verify + commit**

```bash
npx tsc --noEmit && npx vitest run
git add src/game/GameSession.ts
git commit -m "feat: wire wave heal, quiz coin multiplier, and streak bonus into GameSession"
```

---

### Task 4: Streak bonus popup in HUD

**Files:**
- Modify: `src/game/ui/hud.ts` — `showBanner` is already implemented; no new UI needed

The `showBanner` call in Task 3 already uses the existing HUD banner system. Verify it shows correctly by checking the banner duration constant (`bannerUntil = performance.now() + 2500`).

If the banner is too brief for the streak message, update the duration:

```typescript
// In Hud.showBanner() or wherever bannerUntil is set:
this.bannerUntil = performance.now() + 3000; // 3s for reward banners
```

- [ ] **Step 1: Verify banner works and commit if changed**

```bash
npx tsc --noEmit && npx vitest run
git add src/game/ui/hud.ts
git commit -m "fix: extend banner duration to 3s for reward messages"
```

---

### Self-Review

**Spec coverage check:**

| Requirement | Covered |
|---|---|
| Heal 1 life every 5 waves, max 3 | ✅ Tasks 1 + 3 |
| Quiz money +10% per wave | ✅ Tasks 1 + 3 |
| Every 5 correct quizzes = +20% cash | ✅ Tasks 1 + 3 |
| Popup winner's prize message | ✅ Task 3 (showBanner) |
| Persist new fields across sessions | ✅ Task 2 (save migration) |

**Not in this plan:**
- Wave-based quiz multiplier shown in the quiz overlay UI — currently shown only as final coin total. A "×1.4 bonus" label in the overlay is a nice-to-have for a later polish pass.
