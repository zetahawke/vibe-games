# QoL — Skip Wave & Season Infrastructure Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) Add a "rest skip" button so players can start the next wave early. (2) Award a "skip coin" every 10 waves that lets a player instantly clear the current wave. (3) Lay the database groundwork (Supabase table schemas + types) for session statistics and seasons — actual online sync is in the Online Co-op plan.

**Architecture:** Skip state lives in `GameSave`. The HUD shows the "skip rest" button only during the rest phase. Skip coins persist in the save. Season/session schema is defined as SQL migrations so the Online plan can apply them without revisiting structure.

**Tech Stack:** TypeScript, Vitest, Supabase (schema only — no client calls in this plan)

## Global Constraints

- All new identifiers in English.
- UI text in Spanish.
- No new npm dependencies for the QoL portion.
- `npx vitest run` after every task — all tests green.
- `npx tsc --noEmit` — zero errors.

---

### Task 1: Skip coin domain logic

**Files:**
- Create: `src/domain/rewards/skipLogic.ts`
- Create: `tests/skipLogic.test.ts`

**Interfaces:**
- Produces:
  - `SKIP_COINS_MAX = 2`
  - `shouldAwardSkipCoin(wavesCleared: number): boolean` — true every 10 waves
  - `canSkipWave(skipCoins: number): boolean`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/skipLogic.test.ts
import { describe, expect, it } from 'vitest';
import { shouldAwardSkipCoin, canSkipWave, SKIP_COINS_MAX } from '@/domain/rewards/skipLogic';

describe('shouldAwardSkipCoin', () => {
  it('awards on every 10th wave', () => {
    expect(shouldAwardSkipCoin(10)).toBe(true);
    expect(shouldAwardSkipCoin(20)).toBe(true);
    expect(shouldAwardSkipCoin(30)).toBe(true);
  });
  it('does not award on non-multiples of 10', () => {
    expect(shouldAwardSkipCoin(0)).toBe(false);
    expect(shouldAwardSkipCoin(5)).toBe(false);
    expect(shouldAwardSkipCoin(11)).toBe(false);
  });
});

describe('canSkipWave', () => {
  it('true when skipCoins > 0', () => {
    expect(canSkipWave(1)).toBe(true);
    expect(canSkipWave(2)).toBe(true);
  });
  it('false when no skip coins', () => {
    expect(canSkipWave(0)).toBe(false);
  });
});

describe('SKIP_COINS_MAX', () => {
  it('is 2', () => {
    expect(SKIP_COINS_MAX).toBe(2);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run tests/skipLogic.test.ts
```

- [ ] **Step 3: Implement `src/domain/rewards/skipLogic.ts`**

```typescript
/** Maximum skip coins a player can hold at once. */
export const SKIP_COINS_MAX = 2;

/**
 * True when a skip coin should be awarded.
 * Fires every 10 waves cleared.
 */
export function shouldAwardSkipCoin(wavesCleared: number): boolean {
  return wavesCleared > 0 && wavesCleared % 10 === 0;
}

/** True when the player has at least one skip coin to spend. */
export function canSkipWave(skipCoins: number): boolean {
  return skipCoins > 0;
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run tests/skipLogic.test.ts && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/domain/rewards/skipLogic.ts tests/skipLogic.test.ts
git commit -m "feat: add skip coin domain logic"
```

---

### Task 2: Add skip + progression fields to GameSave

> **Note:** `wavesCleared` is also defined here (instead of in the Reward plan) since this plan is implemented first.

**Files:**
- Modify: `src/domain/save/save.ts`
- Modify: `tests/save.test.ts`

- [ ] **Step 1: Add fields**

```typescript
export interface GameSave {
  // ... existing fields ...
  /** Skip coins available to instantly clear a wave. Max 2. */
  skipCoins: number;
  /** Total number of waves fully cleared across the current game. */
  wavesCleared: number;
  /** Consecutive correct quiz answers without an explicit quiz exit reset. */
  quizStreak: number;
}
```

In `defaultSave()`: add `skipCoins: 0, wavesCleared: 0, quizStreak: 0`.

In `loadSave()` migration block:
```typescript
if (!Number.isFinite(save.skipCoins))    save.skipCoins = 0;
if (!Number.isFinite(save.wavesCleared)) save.wavesCleared = 0;
if (!Number.isFinite(save.quizStreak))   save.quizStreak = 0;
```

- [ ] **Step 2: Add tests in `tests/save.test.ts`**

```typescript
it('migrates old saves missing skipCoins, wavesCleared and quizStreak', () => {
  const old = mathSave();
  const { skipCoins: _sc, wavesCleared: _wc, quizStreak: _qs, ...rest } = old as any;
  localStorage.setItem(`juegos-de-casa:v1:save:ana`, JSON.stringify(rest));
  const loaded = loadSave('ana');
  expect(loaded?.skipCoins).toBe(0);
  expect(loaded?.wavesCleared).toBe(0);
  expect(loaded?.quizStreak).toBe(0);
});
```

- [ ] **Step 3: Run + commit**

```bash
npx tsc --noEmit && npx vitest run
git add src/domain/save/save.ts tests/save.test.ts
git commit -m "feat: add skipCoins, wavesCleared, quizStreak to GameSave with migration"
```

---

### Task 3: Wire skip coin award into GameSession

**Files:**
- Modify: `src/game/GameSession.ts`

In the wave-completion block added during the Reward System plan (Task 3, Step 2), also check for skip coin award:

- [ ] **Step 1: Add skip coin award**

```typescript
import { shouldAwardSkipCoin, SKIP_COINS_MAX } from '@/domain/rewards/skipLogic';

// Inside the wave→rest transition block:
if (shouldAwardSkipCoin(this.save.wavesCleared)) {
  if (this.save.skipCoins < SKIP_COINS_MAX) {
    this.save.skipCoins += 1;
    this.showBanner('🪙 +1 moneda de salto');
  }
}
```

- [ ] **Step 2: Run + commit**

```bash
npx tsc --noEmit && npx vitest run
git add src/game/GameSession.ts
git commit -m "feat: award skip coin every 10 waves"
```

---

### Task 4: Skip buttons in HUD

**Files:**
- Modify: `src/game/ui/hud.ts`
- Modify: `src/styles/main.css`

Two buttons:

1. **"Saltar descanso"** — visible only during `phase === 'rest'`. Pressing it triggers `onSkipRest()`.
2. **"Saltar oleada" (🪙×N)** — visible only during `phase === 'wave'` and `skipCoins > 0`. Pressing it triggers `onSkipWave()`.

- [ ] **Step 1: Add callbacks to `Hud` constructor options**

In `hud.ts`, the `Hud` constructor currently takes `(touchMode, onShop, onPause)`. Extend it:

```typescript
constructor(
  private touchMode: boolean,
  private onShop: () => void,
  private onPause: () => void,
  private onSkipRest: () => void,
  private onSkipWave: () => void,
) {
```

- [ ] **Step 2: Add skip buttons to the HUD DOM**

```typescript
this.skipRestBtn = el('button', {
  type: 'button',
  className: 'btn ghost hud-skip-btn',
  hidden: true,
}, ['⏭ Saltar descanso']) as HTMLButtonElement;
this.skipWaveBtn = el('button', {
  type: 'button',
  className: 'btn ghost hud-skip-btn',
  hidden: true,
}, ['⏭ Saltar oleada 🪙']) as HTMLButtonElement;

this.skipRestBtn.addEventListener('click', onSkipRest);
this.skipWaveBtn.addEventListener('click', onSkipWave);

// Add to cornerBtns or as a separate bottom-center element:
const skipArea = el('div', { className: 'hud-skip-area' }, [this.skipRestBtn, this.skipWaveBtn]);
this.root.append(skipArea);
```

- [ ] **Step 3: Update `Hud.update()` to toggle visibility**

`Hud.update()` receives the current `GameSave` and `WaveState`. Add:

```typescript
// Toggle skip buttons based on phase and skip coins:
this.skipRestBtn.hidden = phase !== 'rest';
this.skipWaveBtn.hidden = phase !== 'wave' || save.skipCoins <= 0;
this.skipWaveBtn.textContent = `⏭ Saltar oleada 🪙×${save.skipCoins}`;
```

- [ ] **Step 4: Add CSS**

```css
/* src/styles/main.css */
.hud-skip-area {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: .75rem;
  z-index: 20;
}
.hud-skip-btn {
  font-size: .85rem;
  padding: .4rem .9rem;
  opacity: .85;
}
```

- [ ] **Step 5: Wire callbacks in `GameSession`**

In `GameSession.beginWithSave()`, update the `Hud` constructor call:

```typescript
this.hud = new Hud(
  touchMode,
  () => this.requestShop(),
  () => this.openPause(),
  () => this.skipRest(),      // new
  () => this.useSkipWave(),   // new
);
```

Add the two methods to `GameSession`:

```typescript
private skipRest(): void {
  if (this.waves.phase !== 'rest') return;
  // Force-transition to the next wave immediately.
  this.waves = {
    ...this.waves,
    phase: 'wave',
    phaseTimeLeftMs: WAVE_DURATION_MS,
    wave: this.waves.wave + 1,
  };
  this.persist();
}

private useSkipWave(): void {
  if (this.waves.phase !== 'wave') return;
  if (this.save.skipCoins <= 0) return;
  this.save.skipCoins -= 1;
  // Clear all enemies and jump straight to rest.
  this.world?.clearEnemies();
  this.waves = {
    ...this.waves,
    phase: 'rest',
    phaseTimeLeftMs: REST_DURATION_MS,
  };
  this.save.wavesCleared += 1;
  this.persist();
}
```

- [ ] **Step 6: Run + commit**

```bash
npx tsc --noEmit && npx vitest run
git add src/game/ui/hud.ts src/game/GameSession.ts src/styles/main.css
git commit -m "feat: add skip rest button and skip wave coin mechanic"
```

---

### Task 5: Database schema (Supabase SQL migrations)

**Files:**
- Create: `supabase/migrations/20260807000001_players.sql`
- Create: `supabase/migrations/20260807000002_seasons.sql`
- Create: `supabase/migrations/20260807000003_sessions.sql`
- Create: `supabase/migrations/20260807000004_scoreboard.sql`

These migrations define the full schema the Online Co-op plan will use. No client code yet.
RLS is enabled on every table — the anon key has zero DB access.

- [ ] **Step 1: Create players migration**

```sql
-- supabase/migrations/20260807000001_players.sql
create table if not exists players (
  id             uuid primary key default gen_random_uuid(),
  username       text not null unique,
  -- UUID stored in client localStorage; proves username ownership without a password
  session_token  text not null,
  created_at     timestamptz not null default now(),
  last_seen      timestamptz not null default now()
);

alter table players enable row level security;
-- No anon policies = anon key has zero access to this table
```

- [ ] **Step 2: Create seasons migration**

```sql
-- supabase/migrations/20260807000002_seasons.sql
create table if not exists seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  is_active   boolean not null default true
);

-- Only one active season at a time.
create unique index seasons_active_idx on seasons (is_active) where is_active = true;

alter table seasons enable row level security;
```

- [ ] **Step 3: Create sessions migration**

```sql
-- supabase/migrations/20260807000003_sessions.sql
create table if not exists game_sessions (
  id          uuid primary key default gen_random_uuid(),
  season_id   uuid references seasons(id) on delete set null,
  code        char(4) not null unique,  -- 4-digit join code
  status      text not null default 'open' check (status in ('open','active','closed')),
  created_at  timestamptz not null default now(),
  closed_at   timestamptz,
  updated_at  timestamptz not null default now()  -- heartbeat for stale detection
);

create index game_sessions_status_idx on game_sessions(status);

alter table game_sessions enable row level security;

-- session_players: one row per player in a session
create table if not exists session_players (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references game_sessions(id) on delete cascade,
  player_id   uuid not null references players(id),
  is_host     boolean not null default false,
  joined_at   timestamptz not null default now(),
  left_at     timestamptz,
  unique(session_id, player_id)
);

alter table session_players enable row level security;
```

- [ ] **Step 4: Create scoreboard migration**

```sql
-- supabase/migrations/20260807000004_scoreboard.sql
create table if not exists scoreboard_entries (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid references game_sessions(id) on delete cascade,
  season_id       uuid references seasons(id) on delete set null,
  player_id       uuid not null references players(id),
  -- player_count derived from session_players at time of recording
  player_count    smallint not null check (player_count between 1 and 4),
  session_score   integer not null default 0,
  personal_score  integer not null default 0,
  coins_earned    integer not null default 0,
  coins_spent     integer not null default 0,
  last_weapon     text not null default 'knife',
  subject         text not null default 'math',
  grade           text not null default '7th',
  recorded_at     timestamptz not null default now()
);

create index scoreboard_season_idx
  on scoreboard_entries(season_id, player_count, personal_score desc);

alter table scoreboard_entries enable row level security;
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add Supabase schema — players, seasons, sessions, session_players, scoreboard (RLS on all)"
```

---

### Self-Review

| Requirement | Covered |
|---|---|
| Rest skip button | ✅ Task 4 |
| Skip wave coin every 10 waves, max 2 | ✅ Tasks 1–3 |
| Online: skip coin clears whole session wave | Deferred to Online plan |
| Session stats in database | ✅ Task 5 (schema) |
| Season table, active season flag | ✅ Task 5 |
| No leaderboard without active season | Schema supports it; enforcement in Online plan |
