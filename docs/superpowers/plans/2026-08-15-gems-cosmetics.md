# Gems + Cosmetic Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Account gems from in-run streaks; permanent cosmetic inventory on profile; new paid cosmetics (beanie, Argentina jersey, football shorts, spiky hair); legacy cosmetics stay owned.

**Architecture:** Domain catalog + gem-streak helpers; extend `PlayerProfile` with gems/inventory/`hairId`; profile UI buys/equips; `GameSession` awards gems to profile; player rig hair slot; Supabase migration + profile API allow-lists/sync (client PATCH, same trust model as today).

**Tech Stack:** TypeScript, Vitest, localStorage profile, Supabase SQL, existing boxing overlays

## Global Constraints

- Start gems **0**; wave/quiz gem every **5** consecutive successes in the **same run**; reset on fail / game over / new game.
- Prices: cap/jersey/shinguards/beanie/jersey_argentina/shorts_football/hair_spiky = **10**; armor = **20**.
- Migrate: own `cap`, `jersey`, `armor`, `shinguards` + all `none`s.
- English ids; Spanish UI labels.
- `npx vitest run` green after each task; `npx tsc --noEmit` before handoff.

**Spec:** `docs/superpowers/specs/2026-08-15-gems-cosmetics-design.md`

---

## File map

| File | Role |
|------|------|
| `src/domain/cosmetics/catalog.ts` | Ids, prices, labels, legacy owned seeds |
| `src/domain/rewards/gemLogic.ts` | Streak → gem award pure functions |
| `src/domain/profile/profile.ts` | gems, inventory, hairId, normalize/migrate |
| `src/assets/boxing/manifest.ts` | HAT/SHIRT/PANTS/HAIR id lists |
| `src/assets/boxing/boxes/player/overlays/...` | New box models |
| `src/game/world/player.ts` | hairSlot + default hair toggle |
| `src/game/ui/screens/profileScreen.ts` | Gems UI + buy/equip |
| `src/game/GameSession.ts` | Award gems; persist profile |
| `src/domain/save/save.ts` | Optional run streak fields OR session-only in GameSession |
| `supabase/migrations/20260815000001_gems_cosmetics.sql` | DB columns |
| `api/players/_profile.ts` (+ register/recover selects) | Sync |
| Coop / matchStore / net types | `hairId` |

**Decision:** Keep `waveGemStreak` / `quizGemStreak` as **private fields on `GameSession`** (not GameSave) so new game / dispose naturally resets. Award writes gems via `loadProfile` → mutate → `saveProfile`.

---

### Task 1: Catalog + gem streak logic (TDD)

**Files:**
- Create: `src/domain/cosmetics/catalog.ts`
- Create: `src/domain/rewards/gemLogic.ts`
- Create: `tests/cosmeticsCatalog.test.ts`
- Create: `tests/gemLogic.test.ts`

**Interfaces:**
- Produces:
  - `CosmeticSlot = 'hat' | 'shirt' | 'pants' | 'hair'`
  - `COSMETIC_PRICES: Record<string, number>`
  - `LEGACY_OWNED_HATS/SHIRTS/PANTS`
  - `cosmeticLabel(id): string`
  - `GEM_STREAK_LEN = 5`
  - `registerStreakSuccess(streak: number): { streak: number; gemsAwarded: number }`
  - `resetStreak(): 0`

- [ ] **Step 1: Write tests**

```typescript
// tests/gemLogic.test.ts
import { describe, expect, it } from 'vitest';
import { GEM_STREAK_LEN, registerStreakSuccess, resetStreak } from '@/domain/rewards/gemLogic';

describe('gemLogic', () => {
  it('awards 1 gem every 5 successes', () => {
    let s = 0;
    let gems = 0;
    for (let i = 0; i < 5; i++) {
      const r = registerStreakSuccess(s);
      s = r.streak;
      gems += r.gemsAwarded;
    }
    expect(GEM_STREAK_LEN).toBe(5);
    expect(gems).toBe(1);
    expect(s).toBe(0); // reset after award (modulo style)
  });
  it('resetStreak returns 0', () => {
    expect(resetStreak()).toBe(0);
  });
});
```

```typescript
// tests/cosmeticsCatalog.test.ts
import { describe, expect, it } from 'vitest';
import { COSMETIC_PRICES, LEGACY_OWNED_HATS, LEGACY_OWNED_SHIRTS, LEGACY_OWNED_PANTS } from '@/domain/cosmetics/catalog';

describe('cosmetics catalog', () => {
  it('prices match design', () => {
    expect(COSMETIC_PRICES.cap).toBe(10);
    expect(COSMETIC_PRICES.armor).toBe(20);
    expect(COSMETIC_PRICES.jersey_argentina).toBe(10);
    expect(COSMETIC_PRICES.hair_spiky).toBe(10);
  });
  it('legacy owned seeds include current free cosmetics', () => {
    expect(LEGACY_OWNED_HATS).toEqual(expect.arrayContaining(['none', 'cap']));
    expect(LEGACY_OWNED_SHIRTS).toEqual(expect.arrayContaining(['none', 'jersey', 'armor']));
    expect(LEGACY_OWNED_PANTS).toEqual(expect.arrayContaining(['none', 'shinguards']));
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run tests/gemLogic.test.ts tests/cosmeticsCatalog.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// src/domain/rewards/gemLogic.ts
export const GEM_STREAK_LEN = 5;

export function registerStreakSuccess(streak: number): { streak: number; gemsAwarded: number } {
  const next = streak + 1;
  if (next >= GEM_STREAK_LEN) return { streak: 0, gemsAwarded: 1 };
  return { streak: next, gemsAwarded: 0 };
}

export function resetStreak(): number {
  return 0;
}
```

```typescript
// src/domain/cosmetics/catalog.ts
export type CosmeticSlot = 'hat' | 'shirt' | 'pants' | 'hair';

export const COSMETIC_PRICES: Record<string, number> = {
  cap: 10,
  beanie: 10,
  jersey: 10,
  armor: 20,
  jersey_argentina: 10,
  shinguards: 10,
  shorts_football: 10,
  hair_spiky: 10,
};

export const LEGACY_OWNED_HATS = ['none', 'cap'] as const;
export const LEGACY_OWNED_SHIRTS = ['none', 'jersey', 'armor'] as const;
export const LEGACY_OWNED_PANTS = ['none', 'shinguards'] as const;
export const LEGACY_OWNED_HAIRS = ['none'] as const;

export const COSMETIC_LABELS: Record<string, string> = {
  none: 'Ninguno',
  cap: 'Gorra',
  beanie: 'Gorro',
  jersey: 'Camiseta',
  armor: 'Armadura',
  jersey_argentina: 'Camiseta Argentina',
  shinguards: 'Canilleras',
  shorts_football: 'Shorts de fútbol',
  hair_spiky: 'Peinado punta',
};

export function cosmeticLabel(id: string): string {
  return COSMETIC_LABELS[id] ?? id;
}

export function cosmeticPrice(id: string): number {
  return COSMETIC_PRICES[id] ?? 0;
}
```

- [ ] **Step 4: PASS + commit**

```bash
npx vitest run tests/gemLogic.test.ts tests/cosmeticsCatalog.test.ts
git add src/domain/cosmetics/catalog.ts src/domain/rewards/gemLogic.ts tests/gemLogic.test.ts tests/cosmeticsCatalog.test.ts
git commit -m "$(cat <<'EOF'
Add gem streak helpers and cosmetic price catalog.

EOF
)"
```

---

### Task 2: Manifest ids + profile inventory/gems/hair (TDD)

**Files:**
- Modify: `src/assets/boxing/manifest.ts`
- Modify: `src/domain/profile/profile.ts`
- Modify: `tests/profile.test.ts`

**Interfaces:**
- Produces: `HairId`, extended HAT/SHIRT/PANTS lists; `PlayerProfile` with `gems`, `owned*`, `hairId`; `ownsCosmetic`, `tryBuyCosmetic`, `normalizeProfile` migration

- [ ] **Step 1: Extend manifest**

```typescript
export const HAT_IDS = ['none', 'cap', 'beanie'] as const;
export const SHIRT_IDS = ['none', 'jersey', 'armor', 'jersey_argentina'] as const;
export const PANTS_IDS = ['none', 'shinguards', 'shorts_football'] as const;
export const HAIR_IDS = ['none', 'hair_spiky'] as const;
export type HairId = (typeof HAIR_IDS)[number];
export function normalizeHairId(raw: unknown): HairId {
  return (HAIR_IDS as readonly string[]).includes(String(raw)) ? (raw as HairId) : 'none';
}
```

- [ ] **Step 2: Failing profile tests** (gems default 0, migration owns legacy, buy deducts, cannot equip unowned → normalize to none)

- [ ] **Step 3: Extend `PlayerProfile` + normalize/save/load/profileFromApi**

Include purchase helper:

```typescript
export function tryBuyCosmetic(
  profile: PlayerProfile,
  slot: CosmeticSlot,
  id: string,
): { ok: true; profile: PlayerProfile } | { ok: false; reason: 'owned' | 'funds' | 'unknown' }
```

Ensure equipped ids always ⊆ owned after normalize.

- [ ] **Step 4: PASS + commit**

```bash
npx vitest run tests/profile.test.ts
git add src/assets/boxing/manifest.ts src/domain/profile/profile.ts tests/profile.test.ts
git commit -m "$(cat <<'EOF'
Add profile gems, cosmetic inventory, and hair id.

EOF
)"
```

---

### Task 3: Boxing overlays + player hair slot

**Files:**
- Create: `beanie.ts`, `jersey_argentina` (in shirt.ts or new file), `shorts_football.ts`, `hair_spiky.ts`
- Modify: `src/assets/boxing/index.ts`
- Modify: `src/game/world/player.ts` (+ tests in `playerMuzzle` / new `playerHair.test.ts` if feasible)
- Coop: `PlayerLook.hairId`, OnlineGameSession, matchStore defaults

**Hair behavior:**
- Store references to default hair meshes on `PlayerRig` (`defaultHair: THREE.Object3D[]`).
- `applyOverlays`: if `hairId === 'none'`, show defaultHair; else hide defaultHair and add boxing model to `hairSlot`.

- [ ] **Step 1–3:** Implement models (Argentina: light blue torso + white stripe; beanie dark knit; shorts; spiky boxes upward).
- [ ] **Step 4:** Wire `applyOverlays` + lookFromDraft includes `hairId`.
- [ ] **Step 5:**

```bash
npx vitest run tests/boxingLoader.test.ts tests/playerMuzzle.test.ts tests/profile.test.ts
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git commit -m "$(cat <<'EOF'
Add paid cosmetic models and hair overlay slot.

EOF
)"
```

---

### Task 4: Profile screen buy/equip + gem display

**Files:**
- Modify: `src/game/ui/screens/profileScreen.ts`
- Modify: CSS lightly if needed (`main.css`)

**Behavior:**
- Header/stat: `💎 N`
- For each slot button: if owned → equip on click; if not → label `Nombre · 10💎` and on click `tryBuyCosmetic`; on success refresh UI + preview; on funds fail `playSoftFail`.
- Sync remote: existing profile PATCH path (extend payload with gems/inventory/hair when syncing — see Task 6). For local-only users, `saveProfile` is enough.

- [ ] Implement + manual smoke.
- [ ] Commit

```bash
git commit -m "$(cat <<'EOF'
Let profile buy and equip gem cosmetics.

EOF
)"
```

---

### Task 5: Award gems from GameSession

**Files:**
- Modify: `src/game/GameSession.ts` (and OnlineGameSession if it duplicates quiz/wave clear)

**Logic:**
- Fields: `private waveGemStreak = 0`, `private quizGemStreak = 0`
- On wave clear success path: `registerStreakSuccess(waveGemStreak)`; if gemsAwarded, add to profile gems + banner `+1 💎`
- On quiz correct: same with `quizGemStreak`
- On quiz wrong / game over / dispose starting new: `resetStreak` both (game over / new session)
- Helper `addGemsToProfile(n: number)` load/save profile for `this.username`

- [ ] Prefer a tiny unit-tested wrapper if extraction helps; otherwise manual + existing flow.
- [ ] Commit

```bash
git commit -m "$(cat <<'EOF'
Award profile gems from wave and quiz streaks.

EOF
)"
```

---

### Task 6: Supabase + API sync

**Files:**
- Create: `supabase/migrations/20260815000001_gems_cosmetics.sql`
- Modify: `api/players/_profile.ts`, `_register.ts`, `_recover.ts`
- Modify: `playerService` ProfileApi + `profileFromApi` fields
- Profile screen PATCH body if one exists (grep `players/profile`)

**SQL:**

```sql
alter table players add column if not exists gems integer not null default 0;
alter table players add column if not exists avatar_hair text not null default 'none';
alter table players add column if not exists cosmetic_inventory jsonb not null default '{}'::jsonb;
```

Document that app fills inventory on first normalize if `{}`.

API allow-lists + serialize/update gems, hair, inventory JSON.

- [ ] Update API tests if any (`tests` touching profile API).
- [ ] Commit

```bash
git commit -m "$(cat <<'EOF'
Sync gems and cosmetic inventory through player profile API.

EOF
)"
```

---

### Task 7: Full verify

```bash
npx vitest run
npx tsc --noEmit
```

Manual checklist: migrate old profile owns legacy; buy argentina with gems; 5 waves → gem; wrong quiz resets quiz gem streak; hair_spiky replaces default hair in preview and game.

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| Gem streaks 5/5 | 1, 5 |
| Prices / legacy owned | 1, 2 |
| Inventory + buy | 2, 4 |
| New cosmetics + hair | 3 |
| Profile UI | 4 |
| API/DB | 6 |
