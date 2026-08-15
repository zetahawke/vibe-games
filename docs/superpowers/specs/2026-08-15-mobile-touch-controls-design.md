# Mobile touch controls (Roblox-style) — Design Spec

**Date:** 2026-08-15  
**Status:** Approved for planning  
**Priority in backlog:** E → D → B → C → A (this is E)

---

## 1. Goal

Fix mobile movement that sticks in a fixed direction when the player touches again, and replace the left-half / right-half zones with Roblox-like controls:

- Dynamic movement stick from **any** non-UI touch (fullscreen pad).
- **First finger** = move, **second finger** = look.
- Fixed jump and fire buttons, ~20% larger.

**Success:** On touch devices, releasing and re-touching always starts a fresh move vector; drag updates direction; a second finger looks; fire/jump never start stick or look; no stuck walking after lost pointer capture.

---

## 2. Problem (root cause)

Current HUD uses:

- Left ~50% × bottom 52%: dynamic stick (`bindDynamicStick` in `GameSession`).
- Right half: look (`bindLook`).

Bugs / UX issues:

1. **Stale move vector (symptom C):** `setTouchMove` runs only on `pointermove`. If `pointerup` / `pointercancel` miss (e.g. lost capture with no handler), `touchMove` stays non-zero. A new `pointerdown` resets the visual origin but does **not** clear the previous vector until the next move → character keeps the old direction.
2. **No `pointerId` tracking / no `lostpointercapture`:** incomplete gesture cleanup.
3. **Large left-half origin:** any touch on half the screen becomes the stick; conflicts with wanting fullscreen move + second-finger look.

---

## 3. Behavior

| Gesture | Result |
|---------|--------|
| First `pointerdown` on touch pad (not on a button) | Role **move**: set origin at touch, clear `touchMove` to `(0,0)`, show stick, capture pointer |
| `pointermove` for move id | Clamped vector → `setTouchMove(dx/R, dy/R)` + knob UI |
| Second `pointerdown` while move is active | Role **look**: store last position, capture; deltas → `setTouchLook` |
| Third+ finger | Ignored |
| End move (`up` / `cancel` / `lostpointercapture`) | `setTouchMove(0,0)`, hide stick; clear move id. Look finger, if still down, **keeps look** (does not promote to move) |
| End look | Clear look id only |
| Fire / jump / other HUD controls | Stay on top; do not assign move/look roles |
| `uiBlocking` (shop, quiz, pause, etc.) | Pad ignores new gestures and clears active move/look |

No deadzone in this delivery (can add later).

Stick radius remains **52px** (visual base ~110px), same feel as today.

---

## 4. Architecture

### 4.1 HUD

- Replace separate `stickZone` + `lookZone` with one fullscreen `touchPad` (`touch-action: none`, under buttons via lower `z-index`).
- Stick visual (`stick-base` + `stick-knob`) is a child of the pad; positioned in pad-local coordinates at the move origin.
- Fire / jump: keep fixed bottom-right layout; scale size **~+20%**:
  - Fire: 66 → **79px**
  - Jump: 48 → **58px**
  - Adjust jump `bottom` so it still sits clearly above fire.

Desktop HUD unchanged (pad and touch buttons remain hidden when `!touchMode`).

### 4.2 Touch controller module

New module e.g. `src/game/input/touchControls.ts`:

- `bindTouchControls({ pad, stickBase, stickKnob, input, isBlocked })`
- Tracks `movePointerId`, `lookPointerId`, origin, last look point.
- Wires `pointerdown` / `pointermove` / `pointerup` / `pointercancel` / `lostpointercapture`.
- Calls existing `InputManager.setTouchMove` / `setTouchLook`.

`GameSession.wireHud` removes `bindDynamicStick` / `bindLook` and uses this binder.

### 4.3 InputManager

Keep public API. On every new move gesture, clear move to `(0,0)` before the first meaningful drag (already part of move `pointerdown`). No required API change; optional `clearTouchMove()` helper is fine if it clarifies call sites.

### 4.4 Data flow

```
pointerdown on touchPad
  → no moveId → assign move (origin, clear move, show stick, capture)
  → else no lookId → assign look (last, capture)
  → else ignore
pointermove
  → moveId → clamp → setTouchMove + knob
  → lookId → delta → setTouchLook
pointerup | cancel | lostpointercapture
  → matching id → clear that role (and move vector if move)
```

---

## 5. Out of scope

- Subject/quiz, gems, new weapons, mob speed (backlog D/B/C/A).
- Configurable deadzone, editable button positions, on-screen stick opacity settings.
- Promoting look finger to move when move ends.

---

## 6. Testing

**Unit (preferred):** pure helpers or a small state machine extracted from the binder:

- First pointer → move; second → look; third ignored.
- Ending move clears vector; ending look does not clear move.
- `lostpointercapture` for move clears vector (no stuck walk).
- New move `pointerdown` clears previous vector even if a stale value existed.

**Manual:** touch device or DevTools device mode — walk, change direction after release+retouch, look with second finger, fire/jump without starting stick, open shop and confirm pad is inert.

---

## 7. Files likely touched

- `src/game/ui/hud.ts` — touchPad instead of dual zones
- `src/styles/main.css` — fullscreen pad, button sizes
- `src/game/GameSession.ts` — wire new binder
- `src/game/input/touchControls.ts` — new
- `src/game/input/InputManager.ts` — optional clear helper only
- `tests/touchControls.test.ts` — new

---

## 8. Backlog note (other initiatives)

Agreed delivery order after this spec:

1. **E** — this document (mobile touch)
2. **D** — mob base speed +20%
3. **B** — Kunai + Shuriken; stretch bow projectiles
4. **C** — gems + cosmetic inventory
5. **A** — reusable learning/quiz engine + content JSON keys in English
