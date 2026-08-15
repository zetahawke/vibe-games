# Gems + cosmetic inventory — Design Spec

**Date:** 2026-08-15  
**Status:** Approved for planning  
**Backlog item:** C (after E, D, B; before A learning engine)

---

## 1. Goal

Account-level **gems** earned from in-run streaks, spent once to permanently unlock cosmetics. Profile stores **inventory** + equipped look (including a new **hair** slot). Legacy free cosmetics remain owned after migration.

**Success:** Player starts at 0 gems; after 5 consecutive waves or 5 consecutive correct quizzes in one run, gains 1 gem; can buy new cosmetics; cannot equip unowned items; existing caps/jersey/armor/shinguards stay usable without repurchase.

---

## 2. Economy

| Rule | Behavior |
|------|----------|
| Starting gems | `0` |
| Wave streak | Same match: each block of **5 waves cleared in a row** without game over → **+1 gem**. Counter resets on game over / leaving to hub / new game. |
| Quiz streak | Same match: each block of **5 correct quiz answers in a row** → **+1 gem**. Wrong answer resets quiz gem streak to 0 (existing coin `quizStreak` may stay separate or share — prefer a dedicated `quizGemStreak` on the session/save to avoid coupling coin bonuses). |
| Persistence of gems | On **profile** (account), not wiped by new game. |
| Banner | Short Spanish banner when a gem is awarded (e.g. `+1 💎`). |

Wave progress already increments `wavesCleared` on clear; for gem awards use a **run-local** counter (`waveGemStreak`) that increments per cleared wave and awards `floor` every 5, then subtract 5 (or reset modulo).

---

## 3. Inventory & equip

### Profile fields (local + API)

```typescript
gems: number;                    // >= 0
ownedHats: HatId[];              // always includes 'none'
ownedShirts: ShirtId[];
ownedPants: PantsId[];
ownedHairs: HairId[];            // always includes 'none'
hatId / shirtId / pantsId / hairId;  // equipped; must be owned (else fall back to 'none')
```

### Migration (local + remote default)

On load, if inventory missing:

- Seed owned: `none` + `cap` + `jersey` + `armor` + `shinguards` for their slots; `ownedHairs = ['none']`.
- `gems = 0` if absent.
- If equipped id not in owned → `none`.

### Purchase

Catalog entry: `{ id, slot, priceGems, label }`.

- If already owned → equip only.
- If not owned and `gems >= price` → deduct gems, add to owned, optionally equip.
- Soft fail SFX if insufficient gems.

### Profile UI

- Show gem balance.
- Overlay rows: owned items selectable; locked items show price + **Comprar**.
- Hair row added alongside hat/shirt/pants.

---

## 4. Cosmetic catalog & prices

| Id | Slot | Price | Owned on migrate? | Visual |
|----|------|-------|-------------------|--------|
| `none` | all | — | yes | Empty |
| `cap` | hat | 10 | yes | Existing |
| `beanie` | hat | 10 | **no** | New knit cap |
| `jersey` | shirt | 10 | yes | Existing |
| `armor` | shirt | 20 | yes | Existing |
| `jersey_argentina` | shirt | 10 | **no** | Light blue / white football shirt |
| `shinguards` | pants | 10 | yes | Existing |
| `shorts_football` | pants | 10 | **no** | Football shorts |
| `hair_spiky` | hair | 10 | **no** | Spiky hair overlay |

---

## 5. Hair slot

Today boy/girl hair meshes are built into `buildPlayer`. Add:

- `hairId` on profile / `PlayerLook`.
- `hairSlot` on `PlayerRig` (or reuse a dedicated group).
- When `hairId === 'none'`: keep sex-default hair (current behavior).
- When `hairId === 'hair_spiky'`: **hide/remove** default hair meshes, attach boxing overlay `hair_spiky` on the head.

Coop peer payloads include `hairId` (default `none` for old peers).

---

## 6. Backend (Supabase + API)

Migration SQL on `players`:

- `gems int not null default 0`
- `avatar_hair text not null default 'none'`
- `owned_hats text[]` or `jsonb` default including legacy set (prefer **jsonb** inventory blob `owned_cosmetics` with `{ hats, shirts, pants, hairs }` for fewer columns — **recommendation: one jsonb `cosmetic_inventory`** plus `gems` + `avatar_hair`)

API `_profile` GET/PATCH:

- Allow-lists extended for new overlay ids.
- Accept/return `gems`, `hairId` / `avatar_hair`, inventory.
- Server validates: cannot equip unowned; purchase endpoint **or** trust client PATCH with gem deduction (prefer **server-side purchase** action `POST/PATCH buyCosmetic` to avoid cheating — if YAGNI for v1, document client-authoritative local-first with best-effort sync, same as current profile).

**v1 decision:** Keep parity with today’s profile sync (client PATCH full profile). Validate allow-lists and clamp `gems >= 0`. Anti-cheat hardening can follow later.

Register/recover selects must include new columns.

---

## 7. Architecture approaches (chosen)

**Chosen:** Profile-owned gems + inventory; run-local streak counters for awards; migrate legacy cosmetics as owned; new paid cosmetics; hair slot; API columns + allow-lists.

---

## 8. Testing

- Domain: award gem every 5 wave/quiz streak; purchase deducts; cannot equip unowned; migration seeds legacy owned.
- Profile normalize roundtrip including hair + inventory + gems.
- Boxing loader registers new part ids.
- API allow-list unit tests if present.

---

## 9. Out of scope

- Learning engine content JSON (A)
- Admin UI for gem grants
- Tradable / giftable cosmetics
- Separate “inventory screen” outside profile (profile is the storefront)

---

## 10. Files likely touched

- `src/domain/profile/profile.ts`, cosmetics catalog module
- `src/domain/rewards/` gem streak helpers
- `src/game/GameSession.ts` (award on wave/quiz)
- `src/game/ui/screens/profileScreen.ts`
- `src/game/world/player.ts` (hair)
- `src/assets/boxing/...` new overlays + manifest ids
- `src/domain/online/playerService.ts` + `api/players/_profile.ts` (+ register/recover)
- `supabase/migrations/YYYYMMDD_gems_cosmetics.sql`
- Coop payload / net parse types
