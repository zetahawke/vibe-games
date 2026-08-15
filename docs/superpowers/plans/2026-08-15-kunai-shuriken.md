# Kunai, Shuriken & Longer Bow Arrows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Kunai / Kunai+ (melee) and Shuriken / Shuriken+ (ranged black projectile) to the shop arsenal, and stretch bow arrows to Z length 1.1.

**Architecture:** Extend `WeaponKind` / `WeaponId` / `WEAPONS` catalog; register boxing box models; branch projectile mesh by kind; treat `kunai` as melee SFX like knife and `shuriken` as a quiet whoosh. Player melee anim already keys off `isMelee` + `grip: 'right'` — no pose changes needed for kunai.

**Tech Stack:** TypeScript, Three.js box catalogs, Vitest

## Global Constraints

- UI names in Spanish where shown (`Kunai`, `Kunai +`, `Shuriken`, `Shuriken +`); ids English.
- Kunai: price **25 / 50**, damage **20 / 60** (2× / 6× knife’s 10).
- Shuriken: price **15 / 45**, damage **30 / 55** (mirror pistol / pistol_upgraded).
- Bow arrow `BoxGeometry` Z: **0.55 → 1.1**.
- Knife stays free starter. No change to zombie HP curve.
- `npx vitest run` green after each task; `npx tsc --noEmit` before handoff.

**Spec:** `docs/superpowers/specs/2026-08-15-kunai-shuriken-design.md`

---

## File map

| File | Role |
|------|------|
| `src/domain/weapons/weapons.ts` | Kinds, ids, defs, shop order, SFX order |
| `tests/weapons.test.ts` | Catalog assertions |
| `src/assets/boxing/boxes/weapons/kunai.ts` | Box models |
| `src/assets/boxing/boxes/weapons/shuriken.ts` | Box models |
| `src/assets/boxing/index.ts` | Side-effect imports |
| `src/domain/weapons/weaponVisuals.ts` | Shop SVG icons |
| `src/game/world/projectiles.ts` | Shuriken mesh + bow length |
| `src/shared/sfx.ts` | Melee / whoosh branches |
| `tests/projectilesVisual.test.ts` | Optional constants if extracted |

---

### Task 1: Weapon catalog (TDD)

**Files:**
- Modify: `src/domain/weapons/weapons.ts`
- Modify: `tests/weapons.test.ts`

**Interfaces:**
- Produces: ids `kunai`, `kunai_upgraded`, `shuriken`, `shuriken_upgraded` in `WEAPON_IDS` / `WEAPONS` / `UPGRADE_SFX_ORDER`

- [ ] **Step 1: Extend failing tests** in `tests/weapons.test.ts`

```typescript
  it('adds kunai and shuriken with upgraded variants', () => {
    expect(WEAPONS.kunai.price).toBe(25);
    expect(WEAPONS.kunai.damage).toBe(WEAPONS.knife.damage * 2);
    expect(WEAPONS.kunai.isMelee).toBe(true);
    expect(WEAPONS.kunai.kind).toBe('kunai');
    expect(WEAPONS.kunai_upgraded.price).toBe(50);
    expect(WEAPONS.kunai_upgraded.damage).toBe(WEAPONS.knife.damage * 6);
    expect(WEAPONS.kunai_upgraded.isMelee).toBe(true);

    expect(WEAPONS.shuriken.price).toBe(WEAPONS.pistol.price);
    expect(WEAPONS.shuriken.damage).toBe(WEAPONS.pistol.damage);
    expect(WEAPONS.shuriken.isMelee).toBe(false);
    expect(WEAPONS.shuriken.kind).toBe('shuriken');
    expect(WEAPONS.shuriken_upgraded.price).toBe(WEAPONS.pistol_upgraded.price);
    expect(WEAPONS.shuriken_upgraded.damage).toBe(WEAPONS.pistol_upgraded.damage);

    expect(WEAPON_IDS).toContain('kunai');
    expect(WEAPON_IDS).toContain('kunai_upgraded');
    expect(WEAPON_IDS).toContain('shuriken');
    expect(WEAPON_IDS).toContain('shuriken_upgraded');
  });
```

Also extend the existing upgraded-cost test to include kunai/shuriken pairs.

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run tests/weapons.test.ts
```

- [ ] **Step 3: Update `weapons.ts`**

Add to `WeaponKind`: `'kunai' | 'shuriken'`.

Add to `WeaponId`: `'kunai' | 'kunai_upgraded' | 'shuriken' | 'shuriken_upgraded'`.

Insert into `WEAPON_IDS` after knife (melee cluster) and near pistol (shuriken):

```typescript
export const WEAPON_IDS: WeaponId[] = [
  'knife',
  'kunai',
  'kunai_upgraded',
  'sword_shield',
  'sword_shield_upgraded',
  'longsword',
  'longsword_upgraded',
  'pistol',
  'pistol_upgraded',
  'shuriken',
  'shuriken_upgraded',
  'bow',
  'bow_upgraded',
  'shotgun',
  'shotgun_upgraded',
  'rifle',
  'rifle_upgraded',
];
```

Defs:

```typescript
  kunai: {
    id: 'kunai',
    kind: 'kunai',
    grip: 'right',
    name: 'Kunai',
    price: 25,
    damage: 20,
    cooldownMs: 500,
    range: 2.5,
    isMelee: true,
  },
  kunai_upgraded: {
    id: 'kunai_upgraded',
    kind: 'kunai',
    grip: 'right',
    name: 'Kunai +',
    price: 50,
    damage: 60,
    cooldownMs: 450,
    range: 2.7,
    isMelee: true,
  },
  shuriken: {
    id: 'shuriken',
    kind: 'shuriken',
    grip: 'right',
    name: 'Shuriken',
    price: 15,
    damage: 30,
    cooldownMs: 350,
    range: 40,
    isMelee: false,
  },
  shuriken_upgraded: {
    id: 'shuriken_upgraded',
    kind: 'shuriken',
    grip: 'right',
    name: 'Shuriken +',
    price: 45,
    damage: 55,
    cooldownMs: 320,
    range: 42,
    isMelee: false,
  },
```

Append the four ids to `UPGRADE_SFX_ORDER` (after bow entries is fine).

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run tests/weapons.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/domain/weapons/weapons.ts tests/weapons.test.ts
git commit -m "$(cat <<'EOF'
Add Kunai and Shuriken weapon catalog entries.

EOF
)"
```

---

### Task 2: Boxing models + shop icons + SFX

**Files:**
- Create: `src/assets/boxing/boxes/weapons/kunai.ts`
- Create: `src/assets/boxing/boxes/weapons/shuriken.ts`
- Modify: `src/assets/boxing/index.ts`
- Modify: `src/domain/weapons/weaponVisuals.ts`
- Modify: `src/shared/sfx.ts`

**Interfaces:**
- Consumes: new `WeaponId`s / kinds from Task 1
- Produces: registered box parts; icons; SFX branches

- [ ] **Step 1: Register kunai models** (`kunai.ts`)

```typescript
import { registerBoxParts } from '../../registry';

registerBoxParts('kunai', [
  { size: [0.1, 0.28, 0.1], position: [0, -0.12, 0], color: 0x3a3a3a, metal: 0.4, rough: 0.55 },
  { size: [0.07, 0.12, 0.7], position: [0, 0.08, -0.45], color: 0xb8c0cc, metal: 0.9, rough: 0.2 },
  { size: [0.22, 0.04, 0.08], position: [0, 0.02, -0.08], color: 0x222222, metal: 0.5, rough: 0.4 },
]);

registerBoxParts('kunai_upgraded', [
  { size: [0.1, 0.28, 0.1], position: [0, -0.12, 0], color: 0xb8860b, metal: 0.75, rough: 0.3, emissive: 0xd4a017, emissiveIntensity: 0.15 },
  { size: [0.07, 0.12, 0.75], position: [0, 0.08, -0.48], color: 0xffe8a0, metal: 0.95, rough: 0.15, emissive: 0xffd700, emissiveIntensity: 0.2 },
  { size: [0.22, 0.04, 0.08], position: [0, 0.02, -0.08], color: 0xd4a017, metal: 0.8, rough: 0.25 },
]);
```

- [ ] **Step 2: Register shuriken models** (`shuriken.ts`) — flat cross in hand

```typescript
import { registerBoxParts } from '../../registry';

registerBoxParts('shuriken', [
  { size: [0.55, 0.05, 0.12], position: [0, 0, 0], color: 0x1a1a1a, metal: 0.85, rough: 0.25 },
  { size: [0.12, 0.05, 0.55], position: [0, 0, 0], color: 0x1a1a1a, metal: 0.85, rough: 0.25 },
  { size: [0.1, 0.06, 0.1], position: [0, 0, 0], color: 0x333333, metal: 0.5, rough: 0.4 },
]);

registerBoxParts('shuriken_upgraded', [
  { size: [0.55, 0.05, 0.12], position: [0, 0, 0], color: 0x111111, metal: 0.9, rough: 0.2, emissive: 0x444444, emissiveIntensity: 0.1 },
  { size: [0.12, 0.05, 0.55], position: [0, 0, 0], color: 0x111111, metal: 0.9, rough: 0.2, emissive: 0x444444, emissiveIntensity: 0.1 },
  { size: [0.1, 0.06, 0.1], position: [0, 0, 0], color: 0xc9a227, metal: 0.85, rough: 0.2 },
]);
```

- [ ] **Step 3: Import in `index.ts`**

```typescript
import './boxes/weapons/kunai';
import './boxes/weapons/shuriken';
```

- [ ] **Step 4: SVG icons** in `weaponVisuals.ts` before shotgun/rifle fallback

```typescript
  if (kind === 'kunai') {
    const blade = accent ?? '#cfd6e0';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="28" y="36" width="8" height="20" rx="2" fill="#3a3a3a"/><polygon points="32,4 40,36 24,36" fill="${blade}"/><rect x="22" y="32" width="20" height="5" fill="#222"/></svg>`;
  }
  if (kind === 'shuriken') {
    const fill = accent ?? '#1a1a1a';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="28" width="48" height="8" fill="${fill}"/><rect x="28" y="8" width="8" height="48" fill="${fill}"/><circle cx="32" cy="32" r="5" fill="#444"/></svg>`;
  }
```

- [ ] **Step 5: SFX** in `playGunshot`

```typescript
  if (kind === 'knife' || kind === 'kunai' || kind === 'sword_shield' || kind === 'longsword') {
    playTone(240, 70, 'triangle');
    return;
  }
  if (kind === 'shuriken') {
    playTone(520, 40, 'sine');
    playTone(280, 70, 'triangle');
    return;
  }
```

- [ ] **Step 6: Verify boxing loads**

```bash
npx vitest run tests/boxingLoader.test.ts tests/weapons.test.ts
npx tsc --noEmit
```

If boxingLoader enumerates known ids, add the four new ids there if the test requires it.

- [ ] **Step 7: Commit**

```bash
git add src/assets/boxing/boxes/weapons/kunai.ts \
  src/assets/boxing/boxes/weapons/shuriken.ts \
  src/assets/boxing/index.ts \
  src/domain/weapons/weaponVisuals.ts \
  src/shared/sfx.ts
git commit -m "$(cat <<'EOF'
Add Kunai/Shuriken models, icons, and attack SFX.

EOF
)"
```

---

### Task 3: Projectiles (shuriken mesh + longer arrows)

**Files:**
- Modify: `src/game/world/projectiles.ts`
- Create: `tests/projectilesVisual.test.ts` (export small helpers OR test via exported constants)

**Interfaces:**
- Prefer extracting:

```typescript
export const BOW_ARROW_LENGTH = 1.1;
export const SHURIKEN_PROJ_SIZE = { x: 0.22, y: 0.05, z: 0.22 } as const;
```

used inside `spawnProjectiles`.

- [ ] **Step 1: Failing test**

```typescript
// tests/projectilesVisual.test.ts
import { describe, expect, it } from 'vitest';
import { BOW_ARROW_LENGTH, SHURIKEN_PROJ_SIZE } from '@/game/world/projectiles';

describe('projectile visuals', () => {
  it('uses elongated bow arrows', () => {
    expect(BOW_ARROW_LENGTH).toBe(1.1);
  });
  it('uses a thick black shuriken box footprint', () => {
    expect(SHURIKEN_PROJ_SIZE.x).toBeGreaterThanOrEqual(0.16);
    expect(SHURIKEN_PROJ_SIZE.z).toBeGreaterThanOrEqual(0.16);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run tests/projectilesVisual.test.ts
```

- [ ] **Step 3: Update `spawnProjectiles`**

```typescript
export const BOW_ARROW_LENGTH = 1.1;
export const SHURIKEN_PROJ_SIZE = { x: 0.22, y: 0.05, z: 0.22 } as const;

// inside loop, replace mesh creation:
    let mesh: THREE.Mesh;
    if (kind === 'bow') {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xc8a050,
        emissive: 0x664400,
        metalness: 0.2,
        roughness: 0.4,
      });
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, BOW_ARROW_LENGTH), mat);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
    } else if (kind === 'shuriken') {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: 0x000000,
        metalness: 0.85,
        roughness: 0.3,
      });
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(SHURIKEN_PROJ_SIZE.x, SHURIKEN_PROJ_SIZE.y, SHURIKEN_PROJ_SIZE.z),
        mat,
      );
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
    } else {
      const mat = new THREE.MeshStandardMaterial({
        color: kind === 'rifle' ? 0xffe066 : 0xffcc33,
        emissive: 0xaa7700,
        metalness: 0.2,
        roughness: 0.4,
      });
      mesh = new THREE.Mesh(new THREE.SphereGeometry(kind === 'shotgun' ? 0.08 : 0.07, 6, 6), mat);
    }
```

Keep speed: shuriken uses default 48 (same as pistol). Life still `range / speed`.

- [ ] **Step 4: Run full verify**

```bash
npx vitest run
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/game/world/projectiles.ts tests/projectilesVisual.test.ts
git commit -m "$(cat <<'EOF'
Add shuriken projectiles and longer bow arrows.

EOF
)"
```

---

### Task 4: Manual checklist

- [ ] Shop shows Kunai / Kunai+ / Shuriken / Shuriken+ with correct prices
- [ ] Kunai swings like knife; Shuriken fires dark flat projectile
- [ ] Bow arrows look ~2× longer than before
- [ ] Coop / save: equipping new ids does not crash (unknown → knife only for *old* garbage ids)

---

## Spec coverage

| Requirement | Task |
|-------------|------|
| Kunai 25/50, dmg 20/60 | 1 |
| Shuriken = pistol stats | 1 |
| Boxing models + icons + SFX | 2 |
| Thick black shuriken projectile | 3 |
| Bow arrow Z 1.1 | 3 |
| Melee anim reuse | (implicit via `isMelee`) |
