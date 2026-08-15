# Mob Base Speed +20% Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise `BASE_ZOMBIE_SPEED` from 1.85 to 2.22 (+20%) so all enemy types and night mul scale from the new base.

**Architecture:** Single constant change in `enemy.ts`; optional unit test locking the value.

**Tech Stack:** TypeScript, Vitest

## Global Constraints

- Do not change `nightSpeedMul` or per-type `speedFactor`.
- Identifiers stay English.
- `npx vitest run` green after the task.

**Spec:** `docs/superpowers/specs/2026-08-15-mob-base-speed-design.md`

---

### Task 1: Bump base speed + assert

**Files:**
- Modify: `src/game/world/enemy.ts`
- Create: `tests/enemySpeed.test.ts`

**Interfaces:**
- Produces: `BASE_ZOMBIE_SPEED === 2.22`

- [ ] **Step 1: Write failing test**

```typescript
// tests/enemySpeed.test.ts
import { describe, expect, it } from 'vitest';
import { BASE_ZOMBIE_SPEED } from '@/game/world/enemy';

describe('BASE_ZOMBIE_SPEED', () => {
  it('is 20% above the original 1.85 baseline', () => {
    expect(BASE_ZOMBIE_SPEED).toBe(2.22);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run tests/enemySpeed.test.ts
```

Expected: `expected 1.85 to be 2.22`

- [ ] **Step 3: Update constant**

In `src/game/world/enemy.ts`:

```typescript
export const BASE_ZOMBIE_SPEED = 2.22;
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run tests/enemySpeed.test.ts && npx vitest run && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/game/world/enemy.ts tests/enemySpeed.test.ts
git commit -m "$(cat <<'EOF'
Raise enemy base walk speed by 20%.

EOF
)"
```
