# Identificar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hub game Identificar (Vocales / Números / Abecedario) with shared drag-match engine, Spanish Web Speech on success, and refactor Animales onto that engine.

**Architecture:** Extract generic `MatchSession` from `AnimalsSession`. Domain modules for identify catalogs + speech helper. Hub card + settings modal. Animals becomes a thin wrapper over MatchSession.

**Tech Stack:** Vite, TypeScript, Vitest, DOM/CSS, `speechSynthesis`, existing `resolveDrop` / `DropMode`.

## Global Constraints

- UI language: Spanish only
- Rounds: 3 or 4 unique items from theme pool
- Themes: vocales (AEIOU), numeros (1–10), abecedario (A–Z)
- Visuals: large HTML/CSS glyphs (no PNGs for Identificar)
- Speech: `speakEs` via Web Speech API; silent fallback if unavailable
- Drop modes: libre / suave / guiado; default guiado; settings per user for Identificar
- Spec: `docs/superpowers/specs/2026-08-02-identificar-design.md`
- Keep Animales behavior unchanged from player POV after refactor

## File Structure

```
src/shared/speech.ts
src/domain/identify/
  catalog.ts          # themes, pools, spokenLabel, glyphLabel
  round.ts            # pickIdentifyRound
  settings.ts
  index.ts
src/game/match/
  MatchSession.ts     # generic drag/shadow/celebrate
  types.ts            # MatchItem, MatchSessionOptions
src/game/identify/
  IdentifySession.ts  # thin: build items + MatchSession + speak on success
src/game/ui/overlays/
  identifySettingsOverlay.ts
src/game/animals/AnimalsSession.ts  # refactor → MatchSession
src/game/ui/screens/hubScreen.ts
src/app/router.ts
src/main.ts
src/styles/main.css   # .match-* (+ identify screen theme)
tests/
  identifyCatalog.test.ts
  identifyRound.test.ts
  identifySettings.test.ts
  speech.test.ts
```

---

### Task 1: speakEs + identify catalog/round/settings (TDD)

**Files:**
- Create: `src/shared/speech.ts`
- Create: `src/domain/identify/catalog.ts`, `round.ts`, `settings.ts`, `index.ts`
- Test: `tests/speech.test.ts`, `tests/identifyCatalog.test.ts`, `tests/identifyRound.test.ts`, `tests/identifySettings.test.ts`

**Interfaces:**
- `export type IdentifyTheme = 'vocales' | 'numeros' | 'abecedario'`
- `export type IdentifyId = string` // 'A'|'E'|... or '1'..'10'
- `export function poolForTheme(theme: IdentifyTheme): IdentifyId[]`
- `export function glyphLabel(id: IdentifyId): string` // UI letter/digit
- `export function spokenLabel(theme: IdentifyTheme, id: IdentifyId): string`
- `export function pickIdentifyRound(theme: IdentifyTheme, rng?: () => number): IdentifyId[]`
- `export function getIdentifySettings(username: string): { dropMode: DropMode; theme: IdentifyTheme }`
- `export function setIdentifySettings(username: string, s: {...}): void`
- `export function speakEs(text: string): void`

**Spoken map (abecedario — Spanish letter names):**  
A a, B be, C ce, D de, E e, F efe, G ge, H hache, I i, J jota, K ka, L ele, M eme, N ene, Ñ eñe, O o, P pe, Q cu, R erre, S ese, T te, U u, V uve, W uve doble, X equis, Y ye, Z zeta.

**Números:** 1 uno … 10 diez. **Vocales:** spoken = lowercase letter.

- [ ] **Step 1: Write failing tests** for spokenLabel samples, pickIdentifyRound, settings defaults, speakEs no-throw without speechSynthesis.

- [ ] **Step 2: Run — expect FAIL**

Run: `npm test -- tests/identifyCatalog.test.ts tests/identifyRound.test.ts tests/identifySettings.test.ts tests/speech.test.ts`

- [ ] **Step 3: Implement modules**

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/shared/speech.ts src/domain/identify tests/identify*.test.ts tests/speech.test.ts
git commit -m "feat(identify): add catalog, round picker, settings, and speech helper"
```

---

### Task 2: Extract MatchSession

**Files:**
- Create: `src/game/match/types.ts`, `src/game/match/MatchSession.ts`
- Modify: `src/game/animals/AnimalsSession.ts`
- Modify: `src/styles/main.css` (add `.match-screen`, `.match-piece`, `.match-shadow`, `.match-art`, `.match-label`; keep `.animal-*` as aliases OR migrate animals to `.match-*`)

**Interfaces:**

```ts
export interface MatchItem {
  id: string;
  label: string;
  /** HTML for color (piece) art */
  artColorHtml: string;
  /** HTML for shadow art */
  artShadowHtml: string;
}

export interface MatchSessionOptions {
  root: HTMLElement;
  title: string;
  screenClassName?: string; // e.g. 'animals-screen' | 'identify-screen'
  dropMode: DropMode;
  pickRound: () => MatchItem[];
  onSuccess?: (item: MatchItem) => void; // after accept, before celebrate check
  onExit: () => void;
}

export class MatchSession {
  constructor(options: MatchSessionOptions);
  dispose(): void;
}
```

Behavior ported from current AnimalsSession: pointer drag, resolveDrop, softFail shake + tone, success tone, celebrate overlay.

- [ ] **Step 1: Implement MatchSession** by moving logic from AnimalsSession.

- [ ] **Step 2: Rewrite AnimalsSession** as:

```ts
new MatchSession({
  root, title: 'Animales', screenClassName: 'animals-screen',
  dropMode, pickRound: () => pickRound().map(id => ({
    id, label: animalName(id),
    artColorHtml: animalArtHtml(id, graphicsStyle, 'color'),
    artShadowHtml: animalArtHtml(id, graphicsStyle, 'shadow'),
  })),
  onExit,
});
```

Shadow CSS for photo: if art contains `animal-art-photo`, keep class on art wrapper — MatchSession should set art wrapper className from optional `artClassColor` / or parse: simpler to wrap:

```ts
artColorHtml already includes full inner HTML; MatchSession puts it in `.match-art` and for animals pass class via options `artWrapperClass?: (item, variant) => string`.
```

Minimal: AnimalsSession passes HTML that includes `<div class="animal-art animal-art-photo">...</div>` already as artColorHtml — MatchSession uses `.match-art` only as outer; put `artColorHtml` as innerHTML of `.match-art`. For photo shadow filter, include `animal-art-shadow` inside the HTML string from `animalArtHtml` wrapper… Today AnimalsSession sets classes on the div then innerHTML svg/img. Prefer:

```ts
createArt(item, 'color'|'shadow'): { className: string; html: string }
```

in options:

```ts
renderArt: (item, variant) => ({ className: string; html: string })
```

Animals implements renderArt with photo classes; Identify returns `{ className: 'match-glyph', html: '<span>...</span>' }`.

- [ ] **Step 3: `npm test && npm run build`** — Animales still works.

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: extract shared MatchSession for drag-to-shadow games"
```

---

### Task 3: IdentifySession + settings overlay + hub wiring

**Files:**
- Create: `src/game/identify/IdentifySession.ts`
- Create: `src/game/ui/overlays/identifySettingsOverlay.ts`
- Modify: hubScreen, router, main, main.css

**Interfaces:**
- Overlay: theme radios/buttons + drop mode + Jugar → `onPlay(theme, dropMode)`
- `IdentifySession(root, username, theme, dropMode, onExit)` → MatchSession + `onSuccess: (item) => speakEs(spokenLabel(theme, item.id))`
- Glyph art: `<span class="identify-glyph">A</span>` / shadow muted class

- [ ] **Step 1: Overlay + IdentifySession**

- [ ] **Step 2: Hub card Identificar + router.setIdentifyStarter**

- [ ] **Step 3: CSS `.identify-screen`, `.identify-glyph` (font-size clamp ~22vmin)**

- [ ] **Step 4: `npm test && npm run build`**

- [ ] **Step 5: Manual — all three themes, speech, animals still OK**

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(identify): add Identificar game to hub with speech on match"
```

---

### Task 4: Docs

**Files:**
- Modify: `README.md`
- Optional one-liner in suite design spec

- [ ] **Step 1: Document Identificar in README**

- [ ] **Step 2: Commit**

```bash
git commit -m "docs: mention Identificar in README"
```

---

## Spec coverage

| Requirement | Task |
|-------------|------|
| Themes + pools + spoken names | 1 |
| speakEs | 1 |
| Shared match engine | 2 |
| Animals unbroken | 2 |
| Hub + modal + session + speech on success | 3 |
| README | 4 |
