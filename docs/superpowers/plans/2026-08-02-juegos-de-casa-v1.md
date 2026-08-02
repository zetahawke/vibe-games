# Juegos de Casa v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Spanish browser game suite shell with local login, a hub (shooter playable + animals “Próximamente”), and a Roblox-like third-person math/zombie fort shooter with shop, quiz economy, saves, and high scores.

**Architecture:** Vite + TypeScript SPA. Pure game logic (auth, math, economy, waves, save) lives in testable modules. Three.js renders the 3D arena; shop/quiz/hub/login are DOM overlays. One `localStorage` key namespace per player; no backend.

**Tech Stack:** Vite 6, TypeScript 5, Three.js r170+, Vitest, happy-dom (or jsdom) for unit tests. Spanish UI copy only.

## Global Constraints

- UI language: Spanish only
- Devices: PC (keyboard/mouse) and tablet (touch) from v1
- Persistence: `localStorage` only; simple username + password (client-side hash)
- One active save per player; game over deletes active save; high score kept
- Wave cycle: 60s wave + 60s rest; fort has 3 lives; zombie enter fort = −1 life and end round → rest
- Economy: 1 coin per zombie kill; quiz is primary coin source; weapons bought in shop
- Quiz: show reward first; 3 attempts; fail all → 0 coins; buttons Salir / Más fácil :c / Más difícil :D
- Visuals: simple blocky Roblox-like; AABB collisions; YAGNI on physics/audio
- Spec: `docs/superpowers/specs/2026-08-02-juegos-de-casa-design.md`

## File Structure

```
package.json
vite.config.ts
tsconfig.json
index.html
src/
  main.ts
  styles/main.css
  config/gameConfig.ts
  auth/auth.ts
  save/save.ts
  math/mathGenerator.ts
  economy/economy.ts
  quiz/quizSession.ts
  waves/waveLogic.ts
  weapons/weapons.ts
  input/InputManager.ts
  world/
    aabb.ts
    World.ts
    PlayerController.ts
  game/GameSession.ts
  ui/
    dom.ts
    loginScreen.ts
    hubScreen.ts
    hud.ts
    shopOverlay.ts
    quizOverlay.ts
    pauseOverlay.ts
    gameOverOverlay.ts
  app/router.ts
tests/
  auth.test.ts
  mathGenerator.test.ts
  economy.test.ts
  quizSession.test.ts
  waveLogic.test.ts
  save.test.ts
  weapons.test.ts
```

---

### Task 1: Scaffold Vite + TypeScript + Vitest + Three.js

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.ts`, `src/styles/main.css`, `tests/smoke.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: runnable `npm run dev`, `npm test`; entry mounts `#app`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "juegos-de-casa",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "three": "^0.170.0"
  },
  "devDependencies": {
    "@types/three": "^0.170.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`, `tsconfig.json`, `index.html`, entry files**

```ts
// vite.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
});
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Juegos de Casa</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

```ts
// src/main.ts
import './styles/main.css';

const app = document.querySelector('#app');
if (app) {
  app.textContent = 'Juegos de Casa';
}
```

```css
/* src/styles/main.css */
* { box-sizing: border-box; }
html, body, #app { margin: 0; height: 100%; font-family: system-ui, sans-serif; }
```

```ts
// tests/smoke.test.ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 3: Install and verify**

Run: `npm install && npm test && npm run build`  
Expected: tests PASS; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json index.html src tests
git commit -m "chore: scaffold Vite TypeScript Vitest and Three.js"
```

---

### Task 2: Game config + weapons definitions

**Files:**
- Create: `src/config/gameConfig.ts`, `src/weapons/weapons.ts`, `tests/weapons.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `WAVE_DURATION_MS = 60_000`, `REST_DURATION_MS = 60_000`, `MAX_LIVES = 3`
  - `WeaponId = 'cuchillo' | 'pistola' | 'escopeta' | 'rifle'`
  - `WEAPONS: Record<WeaponId, WeaponDef>` with `id`, `name`, `price`, `damage`, `cooldownMs`, `range`, `isMelee`
  - `zombieHpForWave(wave: number): number` — wave 1 HP equals 3× cuchillo damage (dies in 3 knife hits / 1 pistol if pistol.damage = 3× knife)
  - `getWeapon(id: WeaponId): WeaponDef`

- [ ] **Step 1: Write failing tests**

```ts
// tests/weapons.test.ts
import { describe, it, expect } from 'vitest';
import { WEAPONS, zombieHpForWave, getWeapon } from '../src/weapons/weapons';

describe('weapons', () => {
  it('starts with free cuchillo', () => {
    expect(getWeapon('cuchillo').price).toBe(0);
  });

  it('wave 1 zombie dies in 3 cuchillo hits or 1 pistola hit', () => {
    const hp = zombieHpForWave(1);
    expect(hp).toBe(WEAPONS.cuchillo.damage * 3);
    expect(hp).toBe(WEAPONS.pistola.damage);
  });

  it('wave 5 zombie dies in 5 pistola hits or 1 escopeta hit', () => {
    const hp = zombieHpForWave(5);
    expect(hp).toBe(WEAPONS.pistola.damage * 5);
    expect(hp).toBe(WEAPONS.escopeta.damage);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/weapons.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement config + weapons**

```ts
// src/config/gameConfig.ts
export const WAVE_DURATION_MS = 60_000;
export const REST_DURATION_MS = 60_000;
export const MAX_LIVES = 3;
export const COINS_PER_ZOMBIE = 1;
export const QUIZ_MAX_ATTEMPTS = 3;
export const STORAGE_PREFIX = 'juegos-de-casa:v1:';

export type MathTopic = 'sumas' | 'restas' | 'multiplicaciones' | 'divisiones' | 'mixto';

export const QUIZ_REWARDS: Record<number, number> = {
  1: 4,
  2: 10,
  3: 20,
};
```

```ts
// src/weapons/weapons.ts
export type WeaponId = 'cuchillo' | 'pistola' | 'escopeta' | 'rifle';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  price: number;
  damage: number;
  cooldownMs: number;
  range: number;
  isMelee: boolean;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  cuchillo: { id: 'cuchillo', name: 'Cuchillo', price: 0, damage: 10, cooldownMs: 500, range: 2.5, isMelee: true },
  pistola: { id: 'pistola', name: 'Pistola', price: 15, damage: 30, cooldownMs: 350, range: 40, isMelee: false },
  escopeta: { id: 'escopeta', name: 'Escopeta', price: 40, damage: 150, cooldownMs: 900, range: 20, isMelee: false },
  rifle: { id: 'rifle', name: 'Rifle', price: 70, damage: 60, cooldownMs: 180, range: 50, isMelee: false },
};

export function getWeapon(id: WeaponId): WeaponDef {
  return WEAPONS[id];
}

/** HP curve locked to weapon equivalences in the design spec. */
export function zombieHpForWave(wave: number): number {
  const w = Math.max(1, Math.floor(wave));
  if (w <= 1) return WEAPONS.cuchillo.damage * 3; // = pistola
  if (w <= 5) {
    // interpolate hits-with-pistola from 1 @ wave1 to 5 @ wave5
    const pistolHits = 1 + ((w - 1) * (5 - 1)) / (5 - 1);
    return Math.round(WEAPONS.pistola.damage * pistolHits);
  }
  // after 5: keep escopeta-relevant scaling (pistola hits grow)
  const pistolHits = 5 + (w - 5);
  return Math.round(WEAPONS.pistola.damage * pistolHits);
}
```

Note: Adjust `zombieHpForWave` so tests for wave 1 and wave 5 pass exactly (`pistolaHits` at 5 must be 5 and equal `escopeta.damage`). With numbers above: wave1 hp=30; wave5 hp=150=escopeta. For waves 2–4 use linear interpolation between 30 and 150.

Replace the wave≤5 branch with:

```ts
if (w <= 5) {
  const t = (w - 1) / 4; // 0 at w1, 1 at w5
  return Math.round(30 + t * (150 - 30));
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- tests/weapons.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/config/gameConfig.ts src/weapons/weapons.ts tests/weapons.test.ts
git commit -m "feat: add game config and weapon/zombie HP balance"
```

---

### Task 3: Local auth (create / login)

**Files:**
- Create: `src/auth/auth.ts`, `tests/auth.test.ts`

**Interfaces:**
- Consumes: `STORAGE_PREFIX` from `gameConfig`
- Produces:
  - `async function hashPassword(password: string): Promise<string>` (Web Crypto SHA-256 hex)
  - `function listUsers(): string[]`
  - `async function register(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }>`
  - `async function login(username: string, password: string): Promise<{ ok: true; username: string } | { ok: false; error: string }>`
  - `function getSession(): string | null` / `function logout(): void`
  - Storage shape: `{ users: Record<string, { passwordHash: string }> }` under `${STORAGE_PREFIX}accounts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/auth.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { register, login, listUsers, getSession, logout } from '../src/auth/auth';
import { STORAGE_PREFIX } from '../src/config/gameConfig';

beforeEach(() => {
  localStorage.clear();
  logout();
});

describe('auth', () => {
  it('registers and lists user', async () => {
    const r = await register('miguel', 'clave123');
    expect(r.ok).toBe(true);
    expect(listUsers()).toContain('miguel');
  });

  it('rejects duplicate username', async () => {
    await register('miguel', 'clave123');
    const r = await register('miguel', 'otra');
    expect(r.ok).toBe(false);
  });

  it('logs in with correct password', async () => {
    await register('miguel', 'clave123');
    const r = await login('miguel', 'clave123');
    expect(r.ok).toBe(true);
    expect(getSession()).toBe('miguel');
  });

  it('rejects wrong password', async () => {
    await register('miguel', 'clave123');
    const r = await login('miguel', 'nope');
    expect(r.ok).toBe(false);
    expect(getSession()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- tests/auth.test.ts`

- [ ] **Step 3: Implement `src/auth/auth.ts`**

Use `crypto.subtle.digest('SHA-256', ...)` for hashing. Normalize username with `trim().toLowerCase()`. Reject empty username/password with Spanish errors: `'Escribe un nombre'` / `'Escribe una contraseña'` / `'Ese nombre ya existe'` / `'Usuario o contraseña incorrectos'`.

Keep session in memory + `sessionStorage` key `${STORAGE_PREFIX}session` so refresh keeps login in the tab.

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- tests/auth.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/auth/auth.ts tests/auth.test.ts
git commit -m "feat: add local username/password auth"
```

---

### Task 4: Save system + high score

**Files:**
- Create: `src/save/save.ts`, `tests/save.test.ts`

**Interfaces:**
- Consumes: `WeaponId`, `MathTopic`, `STORAGE_PREFIX`, `MAX_LIVES`
- Produces:

```ts
export type Phase = 'wave' | 'rest';

export interface GameSave {
  wave: number;
  phase: Phase;
  phaseTimeLeftMs: number;
  lives: number;
  coins: number;
  ownedWeapons: WeaponId[];
  equippedWeapon: WeaponId;
  mathTopic: MathTopic;
  quizDifficulty: number; // 1..3
}

export function defaultSave(topic: MathTopic): GameSave;
export function loadSave(username: string): GameSave | null;
export function writeSave(username: string, save: GameSave): void;
export function clearSave(username: string): void;
export function getHighScore(username: string): number;
export function updateHighScore(username: string, wave: number): number; // returns new best
```

- [ ] **Step 1: Write failing tests**

```ts
// tests/save.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  defaultSave, loadSave, writeSave, clearSave, getHighScore, updateHighScore,
} from '../src/save/save';

beforeEach(() => localStorage.clear());

describe('save', () => {
  it('roundtrips a save', () => {
    const s = defaultSave('sumas');
    s.coins = 12;
    writeSave('ana', s);
    expect(loadSave('ana')?.coins).toBe(12);
  });

  it('clearSave removes active game but high score remains', () => {
    writeSave('ana', defaultSave('sumas'));
    updateHighScore('ana', 7);
    clearSave('ana');
    expect(loadSave('ana')).toBeNull();
    expect(getHighScore('ana')).toBe(7);
  });

  it('updateHighScore only increases', () => {
    expect(updateHighScore('ana', 3)).toBe(3);
    expect(updateHighScore('ana', 2)).toBe(3);
    expect(updateHighScore('ana', 10)).toBe(10);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `src/save/save.ts`**

Keys: `${STORAGE_PREFIX}save:${username}` and `${STORAGE_PREFIX}hiscore:${username}`.  
`defaultSave`: wave 1, phase `'wave'`, full duration left, lives `MAX_LIVES`, coins 0, owned `['cuchillo']`, equipped `'cuchillo'`, quizDifficulty 1.

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/save/save.ts tests/save.test.ts
git commit -m "feat: add per-player save and high score storage"
```

---

### Task 5: Math question generator

**Files:**
- Create: `src/math/mathGenerator.ts`, `tests/mathGenerator.test.ts`

**Interfaces:**
- Consumes: `MathTopic`
- Produces:

```ts
export interface MathQuestion {
  prompt: string; // e.g. "¿Cuánto es 2 + 5 + 7?"
  answer: number;
  difficulty: number; // 1..3
  topic: MathTopic;
}

export function generateQuestion(topic: MathTopic, difficulty: number, rng?: () => number): MathQuestion;
```

Rules:
- `difficulty` clamped 1..3
- Sumas: diff1 two nums 1–10; diff2 three nums 1–20; diff3 three–four nums 1–50
- Restas: non-negative results only
- Multiplicaciones: tables mostly 2–10; harder → larger factors
- Divisiones: exact integer division only (construct as `a = b * q`)
- Mixto: pick a random sub-topic excluding mixto
- Prompt always Spanish: `¿Cuánto es ${expr}?`

- [ ] **Step 1: Write failing tests** (use seeded rng)

```ts
import { describe, expect, it } from 'vitest';
import { generateQuestion } from '../src/math/mathGenerator';

function seq(nums: number[]) {
  let i = 0;
  return () => nums[i++] ?? 0;
}

describe('mathGenerator', () => {
  it('sumas difficulty 1 produces solvable prompt', () => {
    const q = generateQuestion('sumas', 1, seq([0.1, 0.2]));
    expect(q.prompt.startsWith('¿Cuánto es')).toBe(true);
    expect(typeof q.answer).toBe('number');
  });

  it('divisiones answers are integers', () => {
    for (let d = 1; d <= 3; d++) {
      const q = generateQuestion('divisiones', d, () => Math.random());
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(q.answer).toBeGreaterThan(0);
    }
  });

  it('restas never negative', () => {
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion('restas', 2, Math.random);
      expect(q.answer).toBeGreaterThanOrEqual(0);
    }
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement generator**

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/math/mathGenerator.ts tests/mathGenerator.test.ts
git commit -m "feat: add Spanish math question generator"
```

---

### Task 6: Economy + quiz session logic

**Files:**
- Create: `src/economy/economy.ts`, `src/quiz/quizSession.ts`, `tests/economy.test.ts`, `tests/quizSession.test.ts`

**Interfaces:**
- Consumes: `WEAPONS`, `WeaponId`, `QUIZ_REWARDS`, `QUIZ_MAX_ATTEMPTS`, `generateQuestion`, `MathTopic`
- Produces:

```ts
// economy.ts
export function canAfford(coins: number, weaponId: WeaponId): boolean;
export function buyWeapon(coins: number, owned: WeaponId[], weaponId: WeaponId):
  | { ok: true; coins: number; owned: WeaponId[] }
  | { ok: false; error: string };
export function addCoins(coins: number, amount: number): number;

// quizSession.ts
export interface QuizState {
  topic: MathTopic;
  difficulty: number;
  question: MathQuestion;
  attemptsLeft: number;
  reward: number;
  status: 'active' | 'won' | 'failed';
  lastMessage: string;
}

export function startQuiz(topic: MathTopic, difficulty: number, rng?: () => number): QuizState;
export function adjustDifficulty(state: QuizState, delta: -1 | 1, rng?: () => number): QuizState;
export function submitAnswer(state: QuizState, value: number): QuizState; // won => keep reward; failed => reward effectively 0
export function coinsEarned(state: QuizState): number; // reward if won else 0
```

Spanish messages: `'¡Correcto!'`, `'Incorrecto. Te quedan N intentos'`, `'Se acabaron los intentos. +0 monedas'`.

- [ ] **Step 1: Failing tests for buy + quiz attempts**

```ts
// tests/economy.test.ts
import { describe, expect, it } from 'vitest';
import { buyWeapon, canAfford } from '../src/economy/economy';

describe('economy', () => {
  it('buys pistola when enough coins', () => {
    const r = buyWeapon(20, ['cuchillo'], 'pistola');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.coins).toBe(5);
      expect(r.owned).toContain('pistola');
    }
  });

  it('rejects if already owned', () => {
    const r = buyWeapon(100, ['cuchillo', 'pistola'], 'pistola');
    expect(r.ok).toBe(false);
  });
});
```

```ts
// tests/quizSession.test.ts
import { describe, expect, it } from 'vitest';
import { startQuiz, submitAnswer, coinsEarned, adjustDifficulty } from '../src/quiz/quizSession';

describe('quizSession', () => {
  it('pays full reward on first try', () => {
    let s = startQuiz('sumas', 1, () => 0.1);
    s = submitAnswer(s, s.question.answer);
    expect(s.status).toBe('won');
    expect(coinsEarned(s)).toBe(s.reward);
  });

  it('gives 0 after 3 wrong answers', () => {
    let s = startQuiz('sumas', 2, () => 0.2);
    const wrong = s.question.answer + 999;
    s = submitAnswer(s, wrong);
    s = submitAnswer(s, wrong);
    s = submitAnswer(s, wrong);
    expect(s.status).toBe('failed');
    expect(coinsEarned(s)).toBe(0);
  });

  it('Más fácil lowers difficulty and refreshes question', () => {
    const s0 = startQuiz('sumas', 3, () => 0.3);
    const s1 = adjustDifficulty(s0, -1, () => 0.4);
    expect(s1.difficulty).toBe(2);
    expect(s1.attemptsLeft).toBe(3);
  });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement both modules** (`reward` from `QUIZ_REWARDS[difficulty]`)

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add src/economy/economy.ts src/quiz/quizSession.ts tests/economy.test.ts tests/quizSession.test.ts
git commit -m "feat: add shop economy and quiz session logic"
```

---

### Task 7: Wave / lives state machine (pure)

**Files:**
- Create: `src/waves/waveLogic.ts`, `tests/waveLogic.test.ts`

**Interfaces:**
- Consumes: `WAVE_DURATION_MS`, `REST_DURATION_MS`, `MAX_LIVES`, `Phase` from save
- Produces:

```ts
export interface WaveState {
  wave: number;
  phase: Phase;
  phaseTimeLeftMs: number;
  lives: number;
  status: 'playing' | 'gameover';
}

export function createWaveState(): WaveState;
export function tickWave(state: WaveState, dtMs: number): WaveState;
/** Zombie breached fort */
export function onFortBreached(state: WaveState): WaveState;
export function zombiesToSpawnForWave(wave: number): number; // e.g. 4 + wave
```

Rules:
- During `wave`, timer counts down; at 0 → `rest` with `REST_DURATION_MS`, wave number unchanged until rest ends
- During `rest`, at 0 → `wave + 1`, back to wave phase with full duration
- `onFortBreached`: lives−1; if lives>0 → clear to rest phase full duration (same wave number already “ended”; next rest→wave increments). Spec: lose life ends round → rest. Use: set phase `rest`, reset rest timer, do **not** increment wave until that rest completes.
- If lives===0 → `status: 'gameover'`

- [ ] **Step 1: Failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { createWaveState, tickWave, onFortBreached } from '../src/waves/waveLogic';
import { WAVE_DURATION_MS, REST_DURATION_MS } from '../src/config/gameConfig';

describe('waveLogic', () => {
  it('transitions wave to rest after 60s', () => {
    let s = createWaveState();
    s = tickWave(s, WAVE_DURATION_MS);
    expect(s.phase).toBe('rest');
    expect(s.phaseTimeLeftMs).toBe(REST_DURATION_MS);
  });

  it('rest then increments wave', () => {
    let s = createWaveState();
    s = tickWave(s, WAVE_DURATION_MS);
    s = tickWave(s, REST_DURATION_MS);
    expect(s.phase).toBe('wave');
    expect(s.wave).toBe(2);
  });

  it('breach loses life and goes to rest', () => {
    let s = createWaveState();
    s = onFortBreached(s);
    expect(s.lives).toBe(2);
    expect(s.phase).toBe('rest');
    expect(s.status).toBe('playing');
  });

  it('third breach is game over', () => {
    let s = createWaveState();
    s = onFortBreached(s);
    s = onFortBreached(s);
    s = onFortBreached(s);
    expect(s.lives).toBe(0);
    expect(s.status).toBe('gameover');
  });
});
```

- [ ] **Step 2–4: TDD implement until PASS**

- [ ] **Step 5: Commit**

```bash
git add src/waves/waveLogic.ts tests/waveLogic.test.ts
git commit -m "feat: add wave/rest/lives state machine"
```

---

### Task 8: Login + Hub DOM screens

**Files:**
- Create: `src/ui/dom.ts`, `src/ui/loginScreen.ts`, `src/ui/hubScreen.ts`, `src/app/router.ts`
- Modify: `src/main.ts`, `src/styles/main.css`

**Interfaces:**
- Consumes: `register`, `login`, `getSession`, `loadSave`, `getHighScore`
- Produces: router screens `'login' | 'hub' | 'game'`; hub shows shooter card + disabled animals card with “Próximamente”

- [ ] **Step 1: Implement `el()` helper and login UI**

```ts
// src/ui/dom.ts
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, string> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'className') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c instanceof Node ? c : document.createTextNode(c));
  return node;
}
```

Login: fields Usuario / Contraseña, buttons **Entrar** and **Crear jugador**, error `<p>` in Spanish.

Hub: title **Juegos de Casa**, greeting with username, high score if any, button **Nueva partida** / **Continuar** on shooter card, animals card `class="game-card locked"` with overlay text **Próximamente**, logout button.

- [ ] **Step 2: Wire `router.ts` + `main.ts`** so app starts at login (or hub if session exists). Game screen can be a stub `<div id="game-root">Pronto</div>` until Task 9.

- [ ] **Step 3: Manual check**

Run: `npm run dev`  
Expected: can create user, land on hub, see locked animals card, shooter stub opens.

- [ ] **Step 4: Commit**

```bash
git add src/ui src/app src/main.ts src/styles/main.css
git commit -m "feat: add login and hub with animals placeholder"
```

---

### Task 9: Three.js world, player, zombies, combat

**Files:**
- Create: `src/world/aabb.ts`, `src/world/World.ts`, `src/world/PlayerController.ts`, `src/input/InputManager.ts`, `src/game/GameSession.ts`
- Create: `src/ui/hud.ts`, `src/ui/pauseOverlay.ts`, `src/ui/gameOverOverlay.ts`
- Modify: router to mount real game

**Interfaces:**
- Consumes: wave logic, weapons, economy coins on kill, save load/write, `zombieHpForWave`, `zombiesToSpawnForWave`
- Produces: playable third-person loop

**World rules (implement concretely):**
- Ground plane + blocky fort (group of boxes) at origin; fort breach radius ~4 units
- Player: capsule/boxes; WASD move relative to camera yaw; mouse look (pointer lock on desktop)
- Zombies: green boxes; spawn on circle radius ~35; move toward fort center; speed scales lightly with wave
- Only spawn / move zombies while `phase==='wave'` and game not paused and status playing
- On zombie AABB intersecting fort AABB: `onFortBreached`, remove all zombies
- Combat: if melee and in range → apply damage; else ray/projectile forward up to `range`; respect `cooldownMs`
- Kill: +`COINS_PER_ZOMBIE`, remove zombie
- `InputManager`: keyboard map + touch joystick state `{x,y}` + look delta + `fire` + `shop` + `pause`
- Tablet: left virtual stick, right look zone, big Disparar + Tienda buttons in HUD
- HUD: monedas, vidas, oleada, arma, timer mm:ss, high score, fase
- Pause (Esc / botón): freezes `tickWave` and world
- Game over overlay: message, update high score via `updateHighScore`, `clearSave`, button al hub
- Autosave on entering rest, on pause, when returning to hub

- [ ] **Step 1: Implement `aabb.ts`**

```ts
export interface AABB { minX: number; maxX: number; minZ: number; maxZ: number; }
export function overlaps(a: AABB, b: AABB): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minZ <= b.maxZ && a.maxZ >= b.minZ;
}
```

Add a tiny test in `tests/aabb.test.ts` for overlap true/false.

- [ ] **Step 2: Implement InputManager + PlayerController + World**

Keep World API small:

```ts
class World {
  constructor(container: HTMLElement) {}
  setPaused(p: boolean): void {}
  setWavePhase(phase: Phase, wave: number): void {} // enables/disables spawning
  update(dt: number, input: InputState, equipped: WeaponDef): WorldEvents {}
  dispose(): void {}
}
type WorldEvents = { kills: number; fortBreached: boolean };
```

- [ ] **Step 3: Implement `GameSession`** tying WaveState + World + HUD + save

Flow: choose topic modal if new game → create/load save → start loop with `requestAnimationFrame`.

- [ ] **Step 4: Manual playtest checklist**

1. Move + look on PC  
2. Touch controls visible on narrow width  
3. Survive/rest timers flip at 60s (can temporarily set durations to 5s in config for test, revert after)  
4. Zombie reaching fort reduces life and starts rest  
5. 3 breaches → game over → save cleared, high score kept  

- [ ] **Step 5: Commit**

```bash
git add src/world src/input src/game src/ui/hud.ts src/ui/pauseOverlay.ts src/ui/gameOverOverlay.ts tests/aabb.test.ts
git commit -m "feat: add 3D fort defense gameplay loop"
```

---

### Task 10: Shop + Quiz overlays wired to game

**Files:**
- Create: `src/ui/shopOverlay.ts`, `src/ui/quizOverlay.ts`
- Modify: `GameSession.ts`, `hud.ts`, `src/styles/main.css`

**Interfaces:**
- Consumes: `buyWeapon`, quiz session API, `writeSave`, pause world while open

- [ ] **Step 1: Shop overlay**

List all `WEAPONS`: show price, owned/equipar/comprar.  
Button **Ganar más monedas** → opens quiz.  
Close returns to game (unpause).  
Equip updates `equippedWeapon` immediately.

- [ ] **Step 2: Quiz overlay**

Show prompt + **“Recompensa: N monedas”** + numeric keypad (0–9, borrar, OK) + attempts left.  
Bottom: **Salir** | **Más fácil :c** | **Más difícil :D**.  
On win: `coins += coinsEarned`, autosave, optionally stay for another question or Salir to shop.  
On fail: show +0, allow new question via difficulty buttons or Salir.

- [ ] **Step 3: Manual check**

Buy pistola after earning coins from quiz; verify kill speed vs cuchillo on wave 1.

- [ ] **Step 4: Commit**

```bash
git add src/ui/shopOverlay.ts src/ui/quizOverlay.ts src/game/GameSession.ts src/ui/hud.ts src/styles/main.css
git commit -m "feat: wire shop and math quiz to game economy"
```

---

### Task 11: Polish, topic select, final verification

**Files:**
- Modify: hub/game entry for topic select; CSS for large touch targets; README

**Files:**
- Create: `README.md`
- Modify: `src/ui/hubScreen.ts` / topic modal before new game

- [ ] **Step 1: Nueva partida → modal de tema**

Options: Sumas, Restas, Multiplicaciones, Divisiones fáciles, Mixto. Maps to `MathTopic`. Then `defaultSave(topic)` + start game.

- [ ] **Step 2: README**

Document: `npm install`, `npm run dev`, `npm test`, Spanish-only, localStorage profiles, how to reset (clear site data).

- [ ] **Step 3: Full regression**

Run: `npm test && npm run build`  
Expected: all PASS, build OK.

Manual: login → hub placeholder → new game → quiz monedas → buy weapon → death → high score persists → continue absent after game over.

- [ ] **Step 4: Commit**

```bash
git add README.md src
git commit -m "feat: topic select, touch polish, and README"
```

---

## Self-Review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Vite+TS+Three.js, DOM overlays | 1, 8–10 |
| Spanish UI | Global + UI tasks |
| PC + tablet controls | 9 |
| Local login | 3, 8 |
| Hub + animals Próximamente | 8 |
| 3rd person blocky fort defense | 9 |
| 60s wave / 60s rest | 7, 9 |
| 3 lives, breach ends round → rest | 7, 9 |
| Game over clears save, keeps high score | 4, 9 |
| 1 coin / zombie; shop prices | 2, 6, 10 |
| Quiz reward, 3 tries, easy/hard/exit | 6, 10 |
| Math topics | 5, 11 |
| Zombie HP vs weapons scaling | 2, 9 |
| Autosave / one save | 4, 9 |
| Animals game not built | 8 placeholder only |

No intentional placeholders left in tasks. Weapon damage numbers are fixed so wave 1 / wave 5 tests lock the design equivalences.
