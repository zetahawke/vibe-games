# Kunai, Shuriken, longer bow arrows — Design Spec

**Date:** 2026-08-15  
**Status:** Approved for planning  
**Backlog item:** B (after E touch, D mob speed)

---

## 1. Goal

Add two shop weapons with upgraded variants, and make bow arrows read as elongated shafts instead of short “bullets.”

**Success:** Kunai melee feels like knife (anim/SFX); Shuriken fires a thicker black projectile; bow arrows are ~2× longer on Z; both base and `+` variants appear in the shop/inventory with correct prices and damage.

---

## 2. Weapon defs

New `WeaponKind`s: `kunai`, `shuriken`.

| Id | Kind | Grip | Name | Price | Damage | Cooldown | Range | Melee |
|----|------|------|------|-------|--------|----------|-------|-------|
| `kunai` | kunai | right | Kunai | **25** | **20** (2× knife) | 500 | 2.5 | yes |
| `kunai_upgraded` | kunai | right | Kunai + | **50** | **60** (6× knife) | 450 | 2.7 | yes |
| `shuriken` | shuriken | right | Shuriken | **15** | **30** (= pistol) | 350 | 40 | no |
| `shuriken_upgraded` | shuriken | right | Shuriken + | **45** | **55** (= pistol +) | 320 | 42 | no |

Knife remains the free starter (`price: 0`). Shop order: place Kunai near other melee (after knife / with swords); Shuriken near pistols.

Include both in `WEAPON_IDS` and `UPGRADE_SFX_ORDER`.

---

## 3. Combat / VFX / audio

**Kunai**
- Treat as melee like `knife` in player attack poses and `playGunshot` (same triangle melee blip).
- Boxing model: distinct kunai silhouette (handle + longer angled blade), register `kunai` / `kunai_upgraded` (upgraded can use gold/metal accent).

**Shuriken**
- Ranged via existing `spawnProjectiles`.
- Mesh: dark box (not sphere), thicker than pistol pellet — e.g. `BoxGeometry(0.14, 0.04, 0.14)` or similar flat star-ish cross of boxes if cheap; minimum: single black box `~0.16` on the wide axes, color `0x111111`, low emissive.
- Speed: same as pistol (~48).
- SFX: short whoosh (reuse bow-like triangle tones or a dedicated soft noise), not gunshot.

**Bow arrows**
- Current `BoxGeometry(0.05, 0.05, 0.55)` → **`BoxGeometry(0.05, 0.05, 1.1)`** (~100% longer). Orientation unchanged (`−Z` along flight).

---

## 4. Assets / UI wiring

- `src/assets/boxing/boxes/weapons/kunai.ts`, `shuriken.ts` (+ upgraded part sets)
- Import in `src/assets/boxing/index.ts`
- `weaponPieceIds` default already maps id → right piece; OK if ids match catalog
- SVG icons in `weaponVisuals.ts` for shop rows
- No save migration needed (new ids only)

---

## 5. Testing

- Extend `tests/weapons.test.ts`: prices, damage multiples vs knife, shuriken mirrors pistol base/+ damage & price, new ids resolve.
- Optional projectile geometry constant test if extracted; otherwise manual look at bow/shuriken in-game.

---

## 6. Out of scope

- Gems / cosmetics (C), learning engine (A)
- Changing knife free starter or zombie HP curve
- Physics spin on shuriken (visual-only mesh is enough)
