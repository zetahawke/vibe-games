# Mob base speed +20% — Design Spec

**Date:** 2026-08-15  
**Status:** Approved for planning  
**Backlog item:** D (after E mobile touch)

---

## 1. Goal

Increase all enemy walk speeds by **20%** at the shared base constant. Night waves keep applying their existing multiplier on top of the new base.

**Success:** Day zombies move 20% faster than before; night remains `base × nightSpeedMul` (1.3); no other balance knobs change.

---

## 2. Current behavior

- `BASE_ZOMBIE_SPEED = 1.85` in `src/game/world/enemy.ts`
- Per-type `speedFactor` in `ENEMY_DEFS` scales relative to that base
- `nightSpeedMul(wave)` returns `1.3` on night waves, `1` on day (`src/domain/waves/dayNight.ts`)
- Spawn / refresh paths set `e.speed = BASE_ZOMBIE_SPEED * speedFactor * nightSpeedMul`

---

## 3. Design

Change only:

```typescript
export const BASE_ZOMBIE_SPEED = 2.22; // was 1.85 (+20%)
```

`1.85 * 1.2 = 2.22` exactly.

**Out of scope:** changing `nightSpeedMul`, individual `speedFactor`s, player speed, spawn rates, HP.

---

## 4. Testing

- Optional unit assertion that `BASE_ZOMBIE_SPEED === 2.22` (or a tiny test next to enemy helpers if one exists).
- Existing `dayNight` tests unchanged (still document 30% night mul).
- Manual: day vs night feel faster than pre-change, night still noticeably faster than day.

---

## 5. Files

- Modify: `src/game/world/enemy.ts`
- Optionally: `tests/enemySpeed.test.ts` (or extend an existing enemy test if present)
