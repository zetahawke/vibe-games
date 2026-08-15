# Kunai throwable — Design Spec

**Date:** 2026-08-15  
**Status:** Approved for implementation  
**Type:** Correction to B (kunai was incorrectly melee)

---

## Goal

Make kunai a **thrown** weapon (ranged projectile), distinct from shuriken: slower, shorter range, dagger-shaped projectile; keep current damage (20 / 60) and prices (25 / 50).

**Success:** Equipping kunai shows crosshair; fire spawns an elongated dagger projectile; no melee slash; SFX is throw/whoosh not melee blip.

---

## Stats

| Id | isMelee | Damage | Cooldown | Range | Proj. speed |
|----|---------|--------|----------|-------|-------------|
| `kunai` | false | 20 | 450 | 28 | ~36 |
| `kunai_upgraded` | false | 60 | 400 | 30 | ~36 |

Shuriken unchanged (30/55, range 40/42, speed ~48).

---

## Combat / VFX / audio

- `spawnProjectiles`: branch for `kind === 'kunai'` → `BoxGeometry(0.06, 0.06, 0.45)`, metal gray (`~0x888888`), orient along flight.
- Speed: `36` when kind is kunai (between bow 40 and slower throw feel).
- `playGunshot` / SFX: treat kunai like shuriken/bow (whoosh), **not** knife melee.
- Player attack pose: ranged path (not melee swing). Driven by `isMelee: false`.

---

## Tests

- `kunai` / `kunai_upgraded`: `isMelee === false`, damage 20/60, range ≥ 20.
- Optional: projectile size constant exported like `SHURIKEN_PROJ_SIZE`.

---

## Out of scope

- Redesign hand mesh
- Ammo limits
- Changing shuriken or knife
