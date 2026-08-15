# Mobile Touch Controls (Roblox-style) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace left/right touch zones with a fullscreen pad where the first finger moves (dynamic stick) and the second looks; fix stuck walk direction; enlarge fire/jump ~20%.

**Architecture:** Pure gesture state machine in `touchGesture.ts` (unit-tested) drives roles by `pointerId`. `touchControls.ts` binds DOM pointer events on a fullscreen HUD pad and talks to `InputManager`. Old `bindDynamicStick` / `bindLook` are removed.

**Tech Stack:** TypeScript, Vitest, DOM Pointer Events, existing HUD/CSS

## Global Constraints

- All new identifiers in English.
- UI text in Spanish (unchanged for this feature).
- No new npm dependencies.
- Stick radius **52px**; fire **79px**; jump **58px**.
- First finger = move, second = look, third+ ignored; look does not promote to move when move ends.
- Clear move vector on move `pointerdown` and on move end (`up` / `cancel` / `lostpointercapture`).
- `npx vitest run` green after every task; `npx tsc --noEmit` zero errors before handoff.

**Spec:** `docs/superpowers/specs/2026-08-15-mobile-touch-controls-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `src/game/input/touchGesture.ts` | Pure state: assign roles, clamp stick, end handlers |
| `tests/touchGesture.test.ts` | Unit tests for gesture machine |
| `src/game/input/touchControls.ts` | DOM binder → gesture + InputManager + stick UI |
| `src/game/ui/hud.ts` | `touchPad` replaces `stickZone` + `lookZone` |
| `src/styles/main.css` | Fullscreen pad; button sizes; z-index |
| `src/game/GameSession.ts` | Wire binder; remove old private bind methods |
| `src/game/input/InputManager.ts` | Optional no-op if API already enough |

---

### Task 1: Touch gesture state machine (TDD)

**Files:**
- Create: `src/game/input/touchGesture.ts`
- Create: `tests/touchGesture.test.ts`

**Interfaces:**
- Produces:
  - `STICK_RADIUS = 52`
  - `TouchGestureState` + `createTouchGestureState()`
  - `handleTouchDown(state, pointerId, x, y): DownResult`
  - `handleTouchMove(state, pointerId, x, y): MoveResult`
  - `handleTouchEnd(state, pointerId): EndResult`
  - `clearTouchGesture(state): void` — clears both roles (caller clears input)
  - Types: `DownResult`, `MoveResult`, `EndResult` as below

- [ ] **Step 1: Write failing tests**

```typescript
// tests/touchGesture.test.ts
import { describe, expect, it } from 'vitest';
import {
  STICK_RADIUS,
  clearTouchGesture,
  createTouchGestureState,
  handleTouchDown,
  handleTouchEnd,
  handleTouchMove,
} from '@/game/input/touchGesture';

describe('touchGesture', () => {
  it('first pointer starts move and clears implied fresh origin', () => {
    const s = createTouchGestureState();
    const r = handleTouchDown(s, 1, 100, 200);
    expect(r).toEqual({ action: 'startMove', originX: 100, originY: 200 });
    expect(s.movePointerId).toBe(1);
    expect(s.lookPointerId).toBeNull();
  });

  it('second pointer starts look while move is active', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 10, 10);
    const r = handleTouchDown(s, 2, 50, 60);
    expect(r).toEqual({ action: 'startLook', x: 50, y: 60 });
    expect(s.lookPointerId).toBe(2);
  });

  it('third pointer is ignored', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    handleTouchDown(s, 2, 1, 1);
    expect(handleTouchDown(s, 3, 2, 2)).toEqual({ action: 'ignore' });
  });

  it('move drag returns normalized vector clamped to radius', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    const inside = handleTouchMove(s, 1, STICK_RADIUS / 2, 0);
    expect(inside).toEqual({
      action: 'move',
      nx: 0.5,
      ny: 0,
      knobDx: STICK_RADIUS / 2,
      knobDy: 0,
    });
    const far = handleTouchMove(s, 1, 500, 0);
    expect(far).toEqual({
      action: 'move',
      nx: 1,
      ny: 0,
      knobDx: STICK_RADIUS,
      knobDy: 0,
    });
  });

  it('look drag returns delta from last point and updates last', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    handleTouchDown(s, 2, 10, 20);
    expect(handleTouchMove(s, 2, 15, 28)).toEqual({ action: 'look', dx: 5, dy: 8 });
    expect(handleTouchMove(s, 2, 15, 28)).toEqual({ action: 'look', dx: 0, dy: 0 });
  });

  it('ending move does not promote look to move', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    handleTouchDown(s, 2, 10, 10);
    expect(handleTouchEnd(s, 1)).toEqual({ action: 'endMove' });
    expect(s.movePointerId).toBeNull();
    expect(s.lookPointerId).toBe(2);
  });

  it('ending look leaves move active', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    handleTouchDown(s, 2, 10, 10);
    expect(handleTouchEnd(s, 2)).toEqual({ action: 'endLook' });
    expect(s.movePointerId).toBe(1);
  });

  it('unknown pointer end is none', () => {
    const s = createTouchGestureState();
    expect(handleTouchEnd(s, 99)).toEqual({ action: 'none' });
  });

  it('clearTouchGesture clears both roles', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    handleTouchDown(s, 2, 1, 1);
    clearTouchGesture(s);
    expect(s.movePointerId).toBeNull();
    expect(s.lookPointerId).toBeNull();
  });

  it('new move after end can start again (no stuck role)', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    handleTouchMove(s, 1, 52, 0);
    handleTouchEnd(s, 1);
    const r = handleTouchDown(s, 5, 30, 40);
    expect(r).toEqual({ action: 'startMove', originX: 30, originY: 40 });
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run tests/touchGesture.test.ts
```

Expected: fail resolving `@/game/input/touchGesture` or missing exports.

- [ ] **Step 3: Implement `src/game/input/touchGesture.ts`**

```typescript
export const STICK_RADIUS = 52;

export interface TouchGestureState {
  movePointerId: number | null;
  lookPointerId: number | null;
  originX: number;
  originY: number;
  lookLastX: number;
  lookLastY: number;
}

export type DownResult =
  | { action: 'ignore' }
  | { action: 'startMove'; originX: number; originY: number }
  | { action: 'startLook'; x: number; y: number };

export type MoveResult =
  | { action: 'none' }
  | { action: 'move'; nx: number; ny: number; knobDx: number; knobDy: number }
  | { action: 'look'; dx: number; dy: number };

export type EndResult =
  | { action: 'none' }
  | { action: 'endMove' }
  | { action: 'endLook' };

export function createTouchGestureState(): TouchGestureState {
  return {
    movePointerId: null,
    lookPointerId: null,
    originX: 0,
    originY: 0,
    lookLastX: 0,
    lookLastY: 0,
  };
}

export function clearTouchGesture(state: TouchGestureState): void {
  state.movePointerId = null;
  state.lookPointerId = null;
}

export function handleTouchDown(
  state: TouchGestureState,
  pointerId: number,
  x: number,
  y: number,
): DownResult {
  if (state.movePointerId === null) {
    state.movePointerId = pointerId;
    state.originX = x;
    state.originY = y;
    return { action: 'startMove', originX: x, originY: y };
  }
  if (state.lookPointerId === null && pointerId !== state.movePointerId) {
    state.lookPointerId = pointerId;
    state.lookLastX = x;
    state.lookLastY = y;
    return { action: 'startLook', x, y };
  }
  return { action: 'ignore' };
}

export function handleTouchMove(
  state: TouchGestureState,
  pointerId: number,
  x: number,
  y: number,
): MoveResult {
  if (pointerId === state.movePointerId) {
    let dx = x - state.originX;
    let dy = y - state.originY;
    const len = Math.hypot(dx, dy) || 1;
    if (len > STICK_RADIUS) {
      dx = (dx / len) * STICK_RADIUS;
      dy = (dy / len) * STICK_RADIUS;
    }
    return {
      action: 'move',
      nx: dx / STICK_RADIUS,
      ny: dy / STICK_RADIUS,
      knobDx: dx,
      knobDy: dy,
    };
  }
  if (pointerId === state.lookPointerId) {
    const dx = x - state.lookLastX;
    const dy = y - state.lookLastY;
    state.lookLastX = x;
    state.lookLastY = y;
    return { action: 'look', dx, dy };
  }
  return { action: 'none' };
}

export function handleTouchEnd(state: TouchGestureState, pointerId: number): EndResult {
  if (pointerId === state.movePointerId) {
    state.movePointerId = null;
    return { action: 'endMove' };
  }
  if (pointerId === state.lookPointerId) {
    state.lookPointerId = null;
    return { action: 'endLook' };
  }
  return { action: 'none' };
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run tests/touchGesture.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/game/input/touchGesture.ts tests/touchGesture.test.ts
git commit -m "$(cat <<'EOF'
Add touch gesture state machine for move/look roles.

EOF
)"
```

---

### Task 2: HUD touch pad + CSS sizes

**Files:**
- Modify: `src/game/ui/hud.ts`
- Modify: `src/styles/main.css`

**Interfaces:**
- Consumes: none from Task 1
- Produces: `Hud.touchPad: HTMLElement`, `Hud.stickBase`, `Hud.stickKnob` (or queryable children); remove public `stickZone` / `lookZone`

- [ ] **Step 1: Update `hud.ts`**

Replace stick/look zone construction with:

```typescript
// fields
readonly touchPad: HTMLElement;
readonly stickBase: HTMLElement;
readonly stickKnob: HTMLElement;

// in constructor — remove stickZone / lookZone
this.stickKnob = el('div', { className: 'stick-knob', id: 'stick-knob' });
this.stickBase = el('div', { className: 'stick-base', id: 'stick-base' }, [this.stickKnob]);
this.touchPad = el('div', { className: 'hud-touch-pad', id: 'touch-pad' }, [this.stickBase]);

// touchMode branch: append touchPad (not stick+look)
// desktop: hide touchPad + buttons as today
this.touchPad.hidden = !this.touchMode;
```

Remove all references to `stickZone` / `lookZone`. Grep the repo and fix call sites in the same task only if they break `tsc` (GameSession is Task 4 — temporarily keep compiling by not deleting GameSession binds yet **or** do HUD+CSS first and leave GameSession still referencing old names until Task 4).

**Preferred order in this task:** change HUD API; leave `GameSession` broken until Task 3–4 if needed — better: keep deprecated aliases for one commit? No — Task 2 + Task 3 + Task 4 should land such that `tsc` passes by end of Task 4. After Task 2 alone, `GameSession` will not compile. **Combine verification:** after Task 2, only run tests that don't need full `tsc`, OR implement Task 2+3+4 before expecting `tsc` green.

**Practical approach:** After Step 1 of Task 2, proceed immediately to Tasks 3–4 in the same session before claiming green `tsc`. Still commit Task 2 CSS/HUD when GameSession compiles (commit after Task 4 if needed). For agent discipline: **Task 2 commit only HUD+CSS**; Task 4 restores compile.

If CI runs `tsc` on every commit, commit Tasks 2–4 together as one commit titled covering HUD+binder+wire — but plan prefers small commits. This repo historically commits intermediate states. Prefer:

1. Task 2 commit HUD+CSS (may break GameSession types)
2. Task 3+4 same day restore build

Or single commit for 2–4. **Use one commit at end of Task 4 for HUD+CSS+binder+wire** if the agent cannot leave `main` red. Record both options; **default: commit after Task 4 includes Task 2 files**.

For this plan's checkbox flow: Task 2 has no separate commit step; commit deferred to Task 4.

- [ ] **Step 2: Update CSS in `src/styles/main.css`**

Replace `.hud-stick-zone` / `.hud-look-zone` block with:

```css
/* Fullscreen touch pad (under buttons) */
.hud-touch-pad {
  position: absolute;
  inset: 0;
  touch-action: none;
  pointer-events: auto;
  z-index: 1;
}

.stick-base {
  position: absolute;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: 2px solid rgba(255, 255, 255, 0.35);
  transform: translate(-50%, -50%);
  display: none;
  pointer-events: none;
  z-index: 2;
}

.stick-knob {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.hud-fire-btn {
  /* existing rules… */
  width: 79px;
  height: 79px;
  z-index: 3;
  /* keep other fire styles */
}

.hud-jump-btn {
  /* existing rules… */
  width: 58px;
  height: 58px;
  bottom: 7.6rem; /* keep clear of larger fire */
  z-index: 3;
}
```

Ensure corner buttons / skip buttons keep `z-index >= 4` so they stay above the pad. Update comments that say "Left half" / "Right half".

- [ ] **Step 3: No unit test required** (visual). Confirm `Hud` exports compile in isolation mentally; full verify in Task 4.

---

### Task 3: DOM binder `touchControls.ts`

**Files:**
- Create: `src/game/input/touchControls.ts`

**Interfaces:**
- Consumes: gesture API from Task 1; `InputManager.setTouchMove` / `setTouchLook`
- Produces:
  - `bindTouchControls(opts): { dispose: () => void }`
  - `opts`: `{ pad, stickBase, stickKnob, input: Pick<InputManager,'setTouchMove'|'setTouchLook'>, isBlocked: () => boolean }`

- [ ] **Step 1: Implement binder**

```typescript
// src/game/input/touchControls.ts
import type { InputManager } from './InputManager';
import {
  clearTouchGesture,
  createTouchGestureState,
  handleTouchDown,
  handleTouchEnd,
  handleTouchMove,
} from './touchGesture';

export interface TouchControlsHandle {
  dispose: () => void;
}

type TouchInput = Pick<InputManager, 'setTouchMove' | 'setTouchLook'>;

export function bindTouchControls(opts: {
  pad: HTMLElement;
  stickBase: HTMLElement;
  stickKnob: HTMLElement;
  input: TouchInput;
  isBlocked: () => boolean;
}): TouchControlsHandle {
  const state = createTouchGestureState();
  const { pad, stickBase, stickKnob, input, isBlocked } = opts;

  const hideStick = () => {
    stickBase.style.display = 'none';
    stickKnob.style.transform = 'translate(-50%, -50%)';
  };

  const forceClear = () => {
    const hadMove = state.movePointerId !== null;
    clearTouchGesture(state);
    if (hadMove) {
      input.setTouchMove(0, 0);
      hideStick();
    }
  };

  const onDown = (e: PointerEvent) => {
    if (isBlocked()) {
      forceClear();
      return;
    }
    e.preventDefault();
    const rect = pad.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const result = handleTouchDown(state, e.pointerId, x, y);
    if (result.action === 'ignore') return;
    pad.setPointerCapture(e.pointerId);
    if (result.action === 'startMove') {
      input.setTouchMove(0, 0);
      stickBase.style.left = `${result.originX}px`;
      stickBase.style.top = `${result.originY}px`;
      stickBase.style.display = 'block';
      stickKnob.style.transform = 'translate(-50%, -50%)';
    }
  };

  const onMove = (e: PointerEvent) => {
    if (isBlocked()) {
      forceClear();
      return;
    }
    const rect = pad.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const result = handleTouchMove(state, e.pointerId, x, y);
    if (result.action === 'move') {
      stickKnob.style.transform =
        `translate(calc(-50% + ${result.knobDx}px), calc(-50% + ${result.knobDy}px))`;
      input.setTouchMove(result.nx, result.ny);
    } else if (result.action === 'look') {
      input.setTouchLook(result.dx, result.dy);
    }
  };

  const onEnd = (e: PointerEvent) => {
    const result = handleTouchEnd(state, e.pointerId);
    if (result.action === 'endMove') {
      input.setTouchMove(0, 0);
      hideStick();
    }
  };

  pad.addEventListener('pointerdown', onDown);
  pad.addEventListener('pointermove', onMove);
  pad.addEventListener('pointerup', onEnd);
  pad.addEventListener('pointercancel', onEnd);
  pad.addEventListener('lostpointercapture', onEnd);

  return {
    dispose: () => {
      forceClear();
      pad.removeEventListener('pointerdown', onDown);
      pad.removeEventListener('pointermove', onMove);
      pad.removeEventListener('pointerup', onEnd);
      pad.removeEventListener('pointercancel', onEnd);
      pad.removeEventListener('lostpointercapture', onEnd);
    },
  };
}
```

**Note:** Look uses pad-local coords for deltas; that matches previous client-space deltas as long as the pad does not move mid-gesture (it does not). Same for move origin.

- [ ] **Step 2: Commit deferred to Task 4** (with wiring).

---

### Task 4: Wire GameSession + remove old binders

**Files:**
- Modify: `src/game/GameSession.ts`
- Includes Task 2 HUD/CSS files in the commit if not committed yet

**Interfaces:**
- Consumes: `bindTouchControls`, `Hud.touchPad` / `stickBase` / `stickKnob`
- Produces: working touch session; no `bindDynamicStick` / `bindLook`

- [ ] **Step 1: Wire in `wireHud`**

```typescript
import { bindTouchControls, type TouchControlsHandle } from '@/game/input/touchControls';

// class field
private touchControls: TouchControlsHandle | null = null;

// in wireHud — replace bindDynamicStick / bindLook:
this.touchControls?.dispose();
this.touchControls = bindTouchControls({
  pad: hud.touchPad,
  stickBase: hud.stickBase,
  stickKnob: hud.stickKnob,
  input,
  isBlocked: () => this.uiBlocking || this.paused,
});
```

- [ ] **Step 2: Dispose on session teardown**

In the existing dispose/cleanup path (where `hud.dispose()` / `input.dispose()` run), add:

```typescript
this.touchControls?.dispose();
this.touchControls = null;
```

- [ ] **Step 3: Delete** private methods `bindDynamicStick` and `bindLook` entirely from `GameSession.ts`.

- [ ] **Step 4: Grep** for `stickZone`, `lookZone`, `bindDynamicStick`, `bindLook` — zero hits.

- [ ] **Step 5: Verify**

```bash
npx vitest run
npx tsc --noEmit
```

Expected: all tests pass; no TS errors.

- [ ] **Step 6: Commit**

```bash
git add src/game/input/touchGesture.ts tests/touchGesture.test.ts \
  src/game/input/touchControls.ts src/game/ui/hud.ts \
  src/styles/main.css src/game/GameSession.ts
git commit -m "$(cat <<'EOF'
Use fullscreen Roblox-style touch move/look controls.

EOF
)"
```

(If Task 1 was already committed, omit those files / only add remaining.)

---

### Task 5: Manual checklist (no code)

**Files:** none

- [ ] **Step 1: Manual QA** (DevTools device mode or real phone)

1. Touch pad → stick appears; drag → walk; release → stop.
2. Walk, release, touch elsewhere → **new** direction (no stuck old vector).
3. Hold move, second finger drag → camera looks; release look → still walking.
4. Release move while look held → stop walking; look may continue.
5. Fire / jump do not spawn stick.
6. Open shop / pause → movement clears; pad inert until closed.
7. Fire ~79px, jump ~58px, usable with thumbs.

- [ ] **Step 2: If any fail, fix in a follow-up commit** referencing the failing checklist item — do not silently skip.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Fullscreen pad, any non-UI point | 2, 3 |
| First finger move / second look | 1, 3 |
| Clear vector on new move + end + lost capture | 1, 3 |
| No promote look→move | 1 |
| Buttons +20% (79 / 58) | 2 |
| uiBlocking / pause clears | 3, 4 (`isBlocked`) |
| Unit tests for roles / stuck | 1 |
| Remove dual zones | 2, 4 |

No placeholders remaining. Types consistent: `startMove` / `endMove` / `setTouchMove(0,0)` on move start and end.
