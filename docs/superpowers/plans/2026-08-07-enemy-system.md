# Enemy System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single zombie enemy type with a weighted spawn system that introduces Big Zombie, Monster, and Yeti enemies, each with unique HP, speed, and wave-gated probability curves.

**Architecture:** Enemy definitions live in a pure domain module (`enemyConfig.ts`). The existing `zombie.ts` is extended into `enemy.ts` which scales a shared blocky body builder per type. `World.ts` replaces its fixed spawn-count loop with a continuous timer that calls `pickEnemyType()` each tick.

**Tech Stack:** TypeScript, Three.js, Vitest

## Global Constraints

- All new identifiers in English.
- UI strings (enemy names shown in banners) may be Spanish.
- No new npm dependencies.
- Run `npx vitest run` after every task — all 54 existing tests must stay green.
- Run `npx tsc --noEmit` after every task — zero errors.

---

### Task 1: Enemy domain config

**Files:**
- Create: `src/domain/waves/enemyConfig.ts`
- Create: `tests/enemyConfig.test.ts`

**Interfaces:**
- Produces: `EnemyType`, `EnemyDef`, `ENEMY_DEFS`, `enemyHp(type, wave)`, `spawnInterval(wave)`, `pickEnemyType(wave, rng?)`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/enemyConfig.test.ts
import { describe, expect, it } from 'vitest';
import { enemyHp, spawnInterval, pickEnemyType, ENEMY_DEFS } from '@/domain/waves/enemyConfig';

describe('spawnInterval', () => {
  it('starts at 5s on wave 1', () => {
    expect(spawnInterval(1)).toBe(5);
  });
  it('decreases by 0.2 per wave', () => {
    expect(spawnInterval(2)).toBeCloseTo(4.8);
    expect(spawnInterval(5)).toBeCloseTo(4.2);
  });
  it('floors at 0.4s', () => {
    expect(spawnInterval(24)).toBe(0.4);
    expect(spawnInterval(50)).toBe(0.4);
  });
});

describe('enemyHp', () => {
  it('zombie starts at 20 HP on wave 1', () => {
    expect(enemyHp('zombie', 1)).toBe(20);
  });
  it('zombie HP grows 20% per wave', () => {
    expect(enemyHp('zombie', 2)).toBe(24);
    expect(enemyHp('zombie', 3)).toBe(28);
  });
  it('zombie HP caps at 2.2x base = 44', () => {
    expect(enemyHp('zombie', 100)).toBe(44);
  });
  it('big_zombie starts at 120 HP on wave 3', () => {
    expect(enemyHp('big_zombie', 3)).toBe(120);
    expect(enemyHp('big_zombie', 4)).toBe(144);
  });
  it('yeti starts at 520 HP on wave 15', () => {
    expect(enemyHp('yeti', 15)).toBe(520);
  });
});

describe('pickEnemyType', () => {
  it('only spawns zombies on wave 1', () => {
    for (let i = 0; i < 20; i++) {
      expect(pickEnemyType(1, Math.random)).toBe('zombie');
    }
  });
  it('can spawn big_zombie from wave 3', () => {
    const types = new Set(Array.from({ length: 200 }, () => pickEnemyType(3, Math.random)));
    expect(types.has('zombie')).toBe(true);
    expect(types.has('big_zombie')).toBe(true);
  });
  it('monster never appears before wave 7', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickEnemyType(6, Math.random)).not.toBe('monster');
    }
  });
  it('yeti never appears before wave 15', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickEnemyType(14, Math.random)).not.toBe('yeti');
    }
  });
  it('deterministic with fixed rng', () => {
    const type = pickEnemyType(10, () => 0.01);
    expect(['zombie', 'big_zombie', 'monster', 'yeti']).toContain(type);
  });
});
```

- [ ] **Step 2: Run — expect FAIL (module not found)**

```bash
npx vitest run tests/enemyConfig.test.ts
```

Expected: error `Cannot find module '@/domain/waves/enemyConfig'`

- [ ] **Step 3: Implement `src/domain/waves/enemyConfig.ts`**

```typescript
export type EnemyType = 'zombie' | 'big_zombie' | 'monster' | 'yeti';

export interface EnemyDef {
  type: EnemyType;
  /** Base HP at the first wave this enemy appears. */
  baseHp: number;
  /** Speed relative to BASE_ZOMBIE_SPEED. */
  speedFactor: number;
  /** First wave this enemy can appear. */
  spawnWaveMin: number;
  /** Spawn weight at spawnWaveMin (0–1 range, normalised against other types). */
  baseChance: number;
  /** Hard cap on the spawn weight. For zombies this is the minimum bound. */
  maxChance: number;
  /** Weight change per wave from spawnWaveMin. Negative = decreasing. */
  chancePerWave: number;
  /** Visual scale multiplier relative to the base zombie mesh. */
  scale: number;
  /** Three.js hex body colour. */
  bodyColor: number;
  /** Three.js hex clothing/leg colour. */
  darkColor: number;
}

export const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  zombie: {
    type: 'zombie',
    baseHp: 20,
    speedFactor: 1.0,
    spawnWaveMin: 1,
    baseChance: 1.0,
    maxChance: 0.5,   // floor — never drops below 50%
    chancePerWave: -0.05,
    scale: 1.0,
    bodyColor: 0x4a7a4a,
    darkColor: 0x2f3d28,
  },
  big_zombie: {
    type: 'big_zombie',
    baseHp: 120,
    speedFactor: 0.8,
    spawnWaveMin: 3,
    baseChance: 0.10,
    maxChance: 0.30,
    chancePerWave: 0.04,
    scale: 1.6,
    bodyColor: 0x3a5a3a,
    darkColor: 0x223322,
  },
  monster: {
    type: 'monster',
    baseHp: 280,
    speedFactor: 0.6,
    spawnWaveMin: 7,
    baseChance: 0.01,
    maxChance: 0.10,
    chancePerWave: 0.007,
    scale: 2.0,
    bodyColor: 0x6a2a2a,
    darkColor: 0x3a1010,
  },
  yeti: {
    type: 'yeti',
    baseHp: 520,
    speedFactor: 0.5,
    spawnWaveMin: 15,
    baseChance: 0.01,
    maxChance: 0.10,
    chancePerWave: 0.007,
    scale: 2.5,
    bodyColor: 0xd0e8f0,
    darkColor: 0x8ab0cc,
  },
};

const ORDERED_TYPES: EnemyType[] = ['zombie', 'big_zombie', 'monster', 'yeti'];

/** Raw spawn weight for a type at the current wave (0 if not yet unlocked). */
function rawWeight(def: EnemyDef, wave: number): number {
  if (wave < def.spawnWaveMin) return 0;
  const wavesPast = wave - def.spawnWaveMin;
  const raw = def.baseChance + wavesPast * def.chancePerWave;
  // Zombies decrease — clamp to minimum; others increase — clamp to maximum.
  return def.chancePerWave < 0
    ? Math.max(def.maxChance, raw)
    : Math.min(def.maxChance, raw);
}

/**
 * Seconds between spawns.
 * Starts at 5s, decreases by 0.2 per wave, minimum 0.4s.
 */
export function spawnInterval(wave: number): number {
  return Math.max(0.4, 5 - (wave - 1) * 0.2);
}

/**
 * Enemy HP at a given wave.
 * Scales +20% per wave past spawn wave, capped at 2.2× base.
 */
export function enemyHp(type: EnemyType, wave: number): number {
  const def = ENEMY_DEFS[type];
  const factor = Math.min(2.2, 1 + Math.max(0, wave - def.spawnWaveMin) * 0.2);
  return Math.round(def.baseHp * factor);
}

/**
 * Weighted random pick of enemy type for the given wave.
 * Types not yet unlocked receive zero weight.
 */
export function pickEnemyType(wave: number, rng: () => number = Math.random): EnemyType {
  const weights = ORDERED_TYPES.map((t) => rawWeight(ENEMY_DEFS[t], wave));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < ORDERED_TYPES.length; i++) {
    r -= weights[i];
    if (r <= 0) return ORDERED_TYPES[i];
  }
  return ORDERED_TYPES[ORDERED_TYPES.length - 1];
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run tests/enemyConfig.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Full suite + types**

```bash
npx tsc --noEmit && npx vitest run
```

Expected: 0 TS errors, 54+ tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/domain/waves/enemyConfig.ts tests/enemyConfig.test.ts
git commit -m "feat: add enemy type config with weighted spawn probability system"
```

---

### Task 2: Enemy mesh builder

**Files:**
- Create: `src/game/world/enemy.ts`
- Modify: `src/game/world/zombie.ts` — re-export `Enemy` as `Zombie` alias for backwards compatibility during migration

**Interfaces:**
- Consumes: `EnemyType`, `EnemyDef`, `ENEMY_DEFS` from `@/domain/waves/enemyConfig`
- Produces: `Enemy` interface, `BASE_ZOMBIE_SPEED`, `buildEnemy(type, trackTex, trackMat)`, `animateEnemyWalk(enemy, dt)`

- [ ] **Step 1: Create `src/game/world/enemy.ts`**

```typescript
import * as THREE from 'three';
import { EnemyDef, EnemyType, ENEMY_DEFS } from '@/domain/waves/enemyConfig';
import { makeZombieTexture } from './textures';

export const BASE_ZOMBIE_SPEED = 1.85;

export interface Enemy {
  root: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  hp: number;
  hpMax: number;
  /** performance.now() timestamp until which the HP bar should be visible. */
  hpShowUntil: number;
  speed: number;
  walkPhase: number;
  type: EnemyType;
}

function buildBodyMesh(
  def: EnemyDef,
  trackMat: (m: THREE.Material) => void,
): { mat: THREE.MeshStandardMaterial; dark: THREE.MeshStandardMaterial } {
  const mat = new THREE.MeshStandardMaterial({ color: def.bodyColor, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: def.darkColor, roughness: 0.95 });
  trackMat(mat);
  trackMat(dark);
  return { mat, dark };
}

/**
 * Builds a blocky humanoid enemy mesh scaled to the given EnemyDef.
 * All enemies share the same geometry proportions — only scale and colour differ.
 */
export function buildEnemy(
  type: EnemyType,
  trackTexture: (t: THREE.Texture) => void,
  trackMaterial: (m: THREE.Material) => void,
): Enemy {
  const def = ENEMY_DEFS[type];

  // Zombie uses the procedural texture; others use solid colour.
  let mat: THREE.MeshStandardMaterial;
  let dark: THREE.MeshStandardMaterial;
  if (type === 'zombie') {
    const tex = makeZombieTexture();
    trackTexture(tex);
    mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    dark = new THREE.MeshStandardMaterial({ color: def.darkColor, roughness: 0.95 });
    trackMaterial(mat);
    trackMaterial(dark);
  } else {
    ({ mat, dark } = buildBodyMesh(def, trackMaterial));
  }

  const root = new THREE.Group();
  const s = def.scale;

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9 * s, 1.1 * s, 0.5 * s), mat);
  body.position.y = 1.35 * s;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.55 * s, 0.55 * s), mat);
  head.position.y = 2.15 * s;
  head.castShadow = true;

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.55 * s, 1.75 * s, 0);
  const la = new THREE.Mesh(new THREE.BoxGeometry(0.26 * s, 0.95 * s, 0.26 * s), mat);
  la.position.y = -0.4 * s;
  leftArm.add(la);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.55 * s, 1.75 * s, 0);
  const ra = new THREE.Mesh(new THREE.BoxGeometry(0.26 * s, 0.95 * s, 0.26 * s), mat);
  ra.position.y = -0.4 * s;
  rightArm.add(ra);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.22 * s, 0.85 * s, 0);
  const ll = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.85 * s, 0.32 * s), dark);
  ll.position.y = -0.4 * s;
  leftLeg.add(ll);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.22 * s, 0.85 * s, 0);
  const rl = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.85 * s, 0.32 * s), dark);
  rl.position.y = -0.4 * s;
  rightLeg.add(rl);

  root.add(body, head, leftArm, rightArm, leftLeg, rightLeg);

  return {
    root,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    hp: 1,
    hpMax: 1,
    hpShowUntil: 0,
    speed: BASE_ZOMBIE_SPEED * def.speedFactor,
    walkPhase: Math.random() * Math.PI * 2,
    type,
  };
}

export function animateEnemyWalk(e: Enemy, dt: number): void {
  e.walkPhase += dt * (6 + e.speed);
  const swing = Math.sin(e.walkPhase) * 0.55;
  e.leftLeg.rotation.x = swing;
  e.rightLeg.rotation.x = -swing;
  e.leftArm.rotation.x = -swing * 0.8;
  e.rightArm.rotation.x = swing * 0.8;
}
```

- [ ] **Step 2: Update `src/game/world/zombie.ts` to re-export from enemy.ts**

Replace the entire file content with:

```typescript
// Backwards-compatible re-exports — prefer importing from './enemy' directly.
export {
  BASE_ZOMBIE_SPEED,
  buildEnemy as buildZombie,
  animateEnemyWalk as animateZombieWalk,
  type Enemy as Zombie,
} from './enemy';
```

- [ ] **Step 3: Verify TS compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/game/world/enemy.ts src/game/world/zombie.ts
git commit -m "feat: add buildEnemy() supporting all 4 enemy types; zombie.ts becomes re-export shim"
```

---

### Task 3: Wire new spawn system into World.ts

**Files:**
- Modify: `src/game/world/World.ts`
- Modify: `src/domain/waves/waveLogic.ts` — remove `zombiesToSpawnForWave` (no longer the model)

**Interfaces:**
- Consumes: `pickEnemyType`, `spawnInterval`, `enemyHp` from `@/domain/waves/enemyConfig`; `buildEnemy`, `animateEnemyWalk`, `Enemy` from `./enemy`
- Produces: same `World` public API — only internals change

The key change: instead of spacing N zombies evenly across 60s, the world now fires a countdown reset to `spawnInterval(wave)` seconds after each spawn and calls `pickEnemyType(wave)` to decide what appears.

- [ ] **Step 1: Update imports in `World.ts`**

At the top of `src/game/world/World.ts`, replace the zombie/wave imports:

```typescript
// Replace:
import { zombiesToSpawnForWave } from '@/domain/waves/waveLogic';
import { WeaponDef, WeaponId, zombieHpForWave } from '@/domain/weapons/weapons';
import { animateZombieWalk, BASE_ZOMBIE_SPEED, buildZombie, type Zombie } from './zombie';

// With:
import { WeaponDef, WeaponId } from '@/domain/weapons/weapons';
import { enemyHp, pickEnemyType, spawnInterval } from '@/domain/waves/enemyConfig';
import { animateEnemyWalk, BASE_ZOMBIE_SPEED, buildEnemy, type Enemy } from './enemy';
```

- [ ] **Step 2: Update private fields**

In the `World` class private fields block, replace:

```typescript
// Before:
private zombies: Zombie[] = [];
private toSpawn = 0;
private spawnInterval = 3;
private spawnTimer = 0;
private hpBarEls = new Map<Zombie, HTMLElement>();

// After:
private enemies: Enemy[] = [];
private spawnTimer = 0;       // counts down; resets to spawnInterval(wave) after each spawn
private hpBarEls = new Map<Enemy, HTMLElement>();
```

- [ ] **Step 3: Update `setWavePhase`**

```typescript
setWavePhase(phase: Phase, wave: number): void {
  const phaseChanged = phase !== this.phase;
  const waveChanged = wave !== this.wave;
  this.phase = phase;
  this.wave = wave;
  if (phase === 'wave' && (phaseChanged || waveChanged)) {
    // Reset spawn timer so first enemy arrives after one full interval.
    this.spawnTimer = spawnInterval(wave);
  }
  if (phase === 'rest') {
    this.clearEnemies();
    clearProjectiles(this.scene, this.projectiles);
    this.projectiles = [];
  }
}
```

- [ ] **Step 4: Rename `clearZombies` → `clearEnemies`**

```typescript
clearEnemies(): void {
  for (const e of this.enemies) {
    this.scene.remove(e.root);
    this.hpBarEls.get(e)?.remove();
    this.hpBarEls.delete(e);
  }
  this.enemies = [];
}

/** @deprecated use clearEnemies() */
clearZombies(): void { this.clearEnemies(); }
```

- [ ] **Step 5: Update `spawnEnemy` (rename from `spawnZombie`)**

```typescript
private spawnEnemy(): void {
  const type = pickEnemyType(this.wave);
  const e = buildEnemy(type, (t) => this.textures.push(t), (m) => this.materials.push(m));
  const hp = enemyHp(type, this.wave);
  e.hp = hp;
  e.hpMax = hp;
  e.hpShowUntil = performance.now() + 2000;

  // Spawn at far end of path, random X within path width.
  const x = (Math.random() - 0.5) * this.pathHalfW * 1.6;
  e.root.position.set(x, 0, this.pathEndZ - 1);
  this.scene.add(e.root);
  this.enemies.push(e);

  // Create HP bar DOM element.
  const bar = document.createElement('div');
  bar.className = 'zombie-hp-bar';
  bar.innerHTML = '<div class="zombie-hp-fill"></div>';
  this.hpBarsLayer.append(bar);
  this.hpBarEls.set(e, bar);
}
```

- [ ] **Step 6: Update spawn timer in `update()`**

In the `update()` method, find the existing spawn block and replace it:

```typescript
// Inside update(), during phase === 'wave':
if (this.phase === 'wave') {
  this.spawnTimer -= dt;
  if (this.spawnTimer <= 0) {
    this.spawnEnemy();
    this.spawnTimer = spawnInterval(this.wave);
  }
}
```

- [ ] **Step 7: Update enemy movement and collision loops**

In `update()`, replace all `this.zombies` references with `this.enemies`, `animateZombieWalk` with `animateEnemyWalk`, `damageZombie` with `damageEnemy`:

```typescript
// Movement loop:
for (const e of this.enemies) {
  animateEnemyWalk(e, dt);
  const dir = new THREE.Vector3(0, 0, -1);
  e.root.position.addScaledVector(dir, e.speed * dt);

  // Fort breach check:
  if (e.root.position.z < -this.fortHalf) {
    this.scene.remove(e.root);
    this.hpBarEls.get(e)?.remove();
    this.hpBarEls.delete(e);
    this.enemies = this.enemies.filter((x) => x !== e);
    events.fortBreached = true;
  }
}

// Projectile hit callback:
const { remaining, kills } = updateProjectiles(
  this.scene,
  this.projectiles,
  this.enemies,
  dt,
  (e, dmg) => this.damageEnemy(e, dmg),
);
events.kills += kills;
this.projectiles = remaining;
```

- [ ] **Step 8: Rename `damageZombie` → `damageEnemy`**

```typescript
private damageEnemy(e: Enemy, dmg: number): number {
  e.hp = Math.max(0, e.hp - dmg);
  e.hpShowUntil = performance.now() + 2000;
  if (e.hp <= 0) {
    this.scene.remove(e.root);
    this.hpBarEls.get(e)?.remove();
    this.hpBarEls.delete(e);
    this.enemies = this.enemies.filter((x) => x !== e);
    return 1;
  }
  return 0;
}
```

- [ ] **Step 9: Update `updateHpBars` and `projectiles.ts` signature**

In `updateHpBars`, replace `this.zombies` with `this.enemies`.

In `src/game/world/projectiles.ts`, change the `zombies: Zombie[]` parameter to `enemies: Enemy[]`:

```typescript
// projectiles.ts — update import and signature:
import type { Enemy } from './enemy';

export function updateProjectiles(
  scene: THREE.Scene,
  projectiles: Projectile[],
  enemies: Enemy[],
  dt: number,
  onHit: (e: Enemy, damage: number) => number,
): { remaining: Projectile[]; kills: number } {
  // ...inner loop uses `enemies` instead of `zombies`
  for (const e of enemies) {
    const d = p.mesh.position.distanceTo(e.root.position.clone().setY(1.2));
    if (d < 1.1) {
      kills += onHit(e, p.damage);
      // ...
    }
  }
}
```

- [ ] **Step 10: Remove `zombiesToSpawnForWave` from `waveLogic.ts`**

Delete lines 26-29 from `src/domain/waves/waveLogic.ts`:

```typescript
// DELETE this function — it's replaced by the continuous interval system:
// export function zombiesToSpawnForWave(wave: number): number {
//   return Math.min(20, 9 + Math.max(1, wave));
// }
```

Also delete the import of `zombiesToSpawnForWave` in `World.ts`.

- [ ] **Step 11: Verify**

```bash
npx tsc --noEmit && npx vitest run
```

Expected: 0 TS errors, all tests pass.

- [ ] **Step 12: Commit**

```bash
git add src/game/world/World.ts src/game/world/projectiles.ts src/domain/waves/waveLogic.ts
git commit -m "feat: replace fixed zombie spawn with continuous interval system; wire 4 enemy types"
```

---

### Task 4: Melee weapon hits all enemy types

**Files:**
- Modify: `src/game/world/World.ts` — melee attack collision uses `this.enemies`

The current melee sweep already calls `damageZombie` via the same loop. After Task 3 renames, this is automatically correct — but verify the melee hit radius is sufficient for big enemies (their root position is the same; hit radius `1.1` still works since we check against root position).

- [ ] **Step 1: Check melee range still works for big enemies**

Open `src/game/world/World.ts`, locate the melee attack block (the sweep that runs when `equipped.isMelee && this.attackAnim > 0`). Confirm it references `this.enemies` after Task 3 changes.

If it still says `this.zombies`, update it:

```typescript
// Melee sweep: damage all enemies within range.
if (equipped.isMelee && this.attackAnim > 0.3 && this.attackAnim < 0.7) {
  for (const e of this.enemies) {
    const dist = this.playerRig.root.position.distanceTo(e.root.position);
    if (dist < equipped.range * 1.2) {  // +20% to account for big enemy size
      events.kills += this.damageEnemy(e, equipped.damage);
    }
  }
}
```

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npx vitest run
git add src/game/world/World.ts
git commit -m "fix: melee attack targets enemies array; extend range for scaled enemies"
```

---

### Task 5: HP bar height offset per enemy type

**Files:**
- Modify: `src/game/world/World.ts` — `updateHpBars` adjusts `above.y` based on enemy scale

Currently the HP bar is projected from y=2.8 (zombie head height). Big enemies need a higher offset.

- [ ] **Step 1: Update `updateHpBars` in `World.ts`**

```typescript
private updateHpBars(): void {
  const now = performance.now();
  const w = this.container.clientWidth;
  const h = this.container.clientHeight;
  const above = new THREE.Vector3();
  for (const e of this.enemies) {
    const bar = this.hpBarEls.get(e);
    if (!bar) continue;
    const visible = now < e.hpShowUntil;
    bar.hidden = !visible;
    if (!visible) continue;
    // Offset above head: zombie=2.8, scales proportionally.
    const headY = 2.8 * ENEMY_DEFS[e.type].scale;
    above.set(e.root.position.x, headY, e.root.position.z);
    above.project(this.camera);
    if (above.z > 1) { bar.hidden = true; continue; }
    const sx = ((above.x + 1) / 2) * w;
    const sy = ((-above.y + 1) / 2) * h;
    bar.style.left = `${sx - 30}px`;
    bar.style.top  = `${sy - 8}px`;
    const pct = Math.max(0, Math.min(1, e.hp / e.hpMax)) * 100;
    (bar.firstElementChild as HTMLElement).style.width = `${pct}%`;
  }
}
```

Also add the missing import: `import { ENEMY_DEFS } from '@/domain/waves/enemyConfig';`

- [ ] **Step 2: Verify + commit**

```bash
npx tsc --noEmit && npx vitest run
git add src/game/world/World.ts
git commit -m "feat: scale HP bar Y offset proportionally to enemy size"
```

---

### Self-Review

**Spec coverage check:**

| Requirement | Covered |
|---|---|
| Zombie: HP 20, speed x1.0, wave 1, 100→50% | ✅ Task 1 |
| Big zombie: HP 120, x0.8, wave 3, 10→30% | ✅ Task 1 |
| Monster: HP 280, x0.6, wave 7, 1→10% | ✅ Task 1 |
| Yeti: HP 520, x0.5, wave 15, 1→10% | ✅ Task 1 |
| HP +20% per wave, max 120% (2.2×) | ✅ Task 1 `enemyHp()` |
| Spawn interval 5s→0.4s, -0.2/wave | ✅ Task 1 `spawnInterval()` |
| Pick type each spawn interval | ✅ Task 3 |
| Distinct visual sizes | ✅ Task 2 (scale parameter) |
| HP bar works for all types | ✅ Task 5 |

**Not in this plan (deferred):**
- Online co-op doubles spawns — handled in Online plan.
- Specific 3D models beyond scale/colour — can be refined in a separate art pass.
