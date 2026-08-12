# Boxing Models + Arsenal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Isolate Roblox-like box models behind an importable boxing loader, add player overlay slots (free in profile), and ship bow / sword+shield / longsword (with upgrades) through the shop.

**Architecture:** Typed box catalogs under `src/assets/boxing/` feed a sync `createBoxingModel` loader (GLB branch stubs to boxes/placeholder). `weapons.ts` owns stats + `grip`; `player.ts` owns rig slots (`rightHand` / `leftHand` / overlays) and animation. Profile + API persist overlay ids; coop `peer` carries them.

**Tech Stack:** TypeScript, Three.js, Vitest, Vite, Supabase SQL migration for profile columns.

**Spec:** `docs/superpowers/specs/2026-08-11-boxing-models-design.md`

## Global Constraints

- UI copy in Spanish; code identifiers in English.
- No new npm dependencies (`three` already includes `GLTFLoader` path via `three/examples/jsm/loaders/GLTFLoader.js` only if implementing real GLB load — prefer stub this delivery).
- Combat: stats + visuals only. Shield does not block. Bow has no ammo. Fort lives unchanged. `zombieHpForWave` must stay bit-identical.
- Overlays are free in profile (no cosmetics shop).
- `npx vitest run` and `npx tsc --noEmit` green after every task.
- Prefer keeping public APIs `createWeaponModel` / `buildPlayer` so World/shop/preview keep compiling with small signature extensions.

---

## File map

| File | Role |
|------|------|
| Create `src/assets/boxing/schema.ts` | `BoxPart`, `BoxingRef`, `Grip`, overlay id types |
| Create `src/assets/boxing/registry.ts` | `BOX_CATALOG: Record<string, BoxPart[]>` |
| Create `src/assets/boxing/loader.ts` | `createBoxingModel`, `getBoxParts` |
| Create `src/assets/boxing/boxes/weapons/*.ts` | Per-weapon (and piece) box lists |
| Create `src/assets/boxing/boxes/player/base/*.ts` | head, hair, torso, limbs, skirt |
| Create `src/assets/boxing/boxes/player/overlays/{hat,shirt,pants}/*.ts` | dummy cosmetics |
| Create `src/assets/boxing/manifest.ts` | weapon visual refs + overlay catalog metadata |
| Create `src/assets/boxing/index.ts` | re-exports |
| Create `public/boxing/README.md` | future GLB drop zone |
| Modify `src/domain/weapons/weapons.ts` | kinds, grips, new ids, shop order, sfx order |
| Modify `src/domain/weapons/weaponVisuals.ts` | thin wrapper over boxing loader + SVG icons |
| Modify `src/game/world/player.ts` | slots, overlays, grip animation, sync both hands |
| Modify `src/game/world/World.ts` | pass full look; syncWeaponModel with leftHand |
| Modify `src/game/world/projectiles.ts` | arrow mesh for `bow` |
| Modify `src/shared/sfx.ts` | melee for swords; bow thwip |
| Modify `src/domain/profile/profile.ts` | hat/shirt/pants + normalize |
| Modify `src/game/ui/screens/profileScreen.ts` | overlay selectors |
| Modify `api/players/_profile.ts` (+ register/recover selects) | persist overlays |
| Create `supabase/migrations/20260812000001_avatar_overlays.sql` | columns |
| Modify `src/domain/online/matchStore.ts` | peer overlay fields |
| Modify `src/game/OnlineGameSession.ts` | publish/apply overlays |
| Tests: `tests/boxingLoader.test.ts`, `tests/weapons.test.ts`, `tests/playerMuzzle.test.ts`, `tests/profile.test.ts`, `tests/matchStore.test.ts`, `tests/economy.test.ts` |

---

### Task 1: Boxing schema, registry, loader (boxes)

**Files:**
- Create: `src/assets/boxing/schema.ts`
- Create: `src/assets/boxing/registry.ts`
- Create: `src/assets/boxing/loader.ts`
- Create: `src/assets/boxing/index.ts`
- Create: `src/assets/boxing/boxes/weapons/knife.ts` (minimal seed so registry is non-empty)
- Create: `public/boxing/README.md`
- Test: `tests/boxingLoader.test.ts`

**Interfaces:**
- Produces:

```typescript
// schema.ts
export type Grip = 'right' | 'paired' | 'twoHand';
export type OverlaySlot = 'hat' | 'shirt' | 'pants';
export type BoxingRef =
  | { type: 'boxes'; id: string }
  | { type: 'glb'; url: string; boxesFallbackId?: string };

export interface BoxPart {
  size: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  color: number;
  metal?: number;
  rough?: number;
  emissive?: number;
  emissiveIntensity?: number;
}

// registry.ts — mutate via registerBoxParts during module init
export function registerBoxParts(id: string, parts: BoxPart[]): void;
export function getBoxParts(id: string): BoxPart[] | null;
export function listBoxIds(): string[];

// loader.ts
export function createBoxingModel(ref: BoxingRef): THREE.Group;
export function createBoxingModelWithMaterial(
  id: string,
  material: THREE.Material,
): THREE.Group | null;
```

- [ ] **Step 1: Write the failing test**

```typescript
// tests/boxingLoader.test.ts
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { registerBoxParts, getBoxParts, listBoxIds } from '@/assets/boxing/registry';
import { createBoxingModel, createBoxingModelWithMaterial } from '@/assets/boxing/loader';
import '@/assets/boxing/boxes/weapons/knife'; // side-effect register

describe('boxing registry', () => {
  it('registers knife parts', () => {
    expect(getBoxParts('knife')?.length).toBeGreaterThan(0);
    expect(listBoxIds()).toContain('knife');
  });
});

describe('createBoxingModel', () => {
  it('builds a Group with meshes from boxes', () => {
    const g = createBoxingModel({ type: 'boxes', id: 'knife' });
    expect(g).toBeInstanceOf(THREE.Group);
    let meshes = 0;
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes++; });
    expect(meshes).toBe((getBoxParts('knife') ?? []).length);
  });

  it('unknown boxes id yields a placeholder cube', () => {
    const g = createBoxingModel({ type: 'boxes', id: 'missing_xyz' });
    expect(g.children.length).toBeGreaterThan(0);
  });

  it('glb with boxesFallbackId uses boxes when GLB is not loaded', () => {
    const g = createBoxingModel({
      type: 'glb',
      url: '/boxing/missing.glb',
      boxesFallbackId: 'knife',
    });
    let meshes = 0;
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes++; });
    expect(meshes).toBe((getBoxParts('knife') ?? []).length);
  });

  it('createBoxingModelWithMaterial applies one material to all meshes', () => {
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const g = createBoxingModelWithMaterial('knife', mat);
    expect(g).not.toBeNull();
    g!.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        expect((o as THREE.Mesh).material).toBe(mat);
      }
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/boxingLoader.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement schema, registry, knife seed, loader, README**

```typescript
// src/assets/boxing/schema.ts — types as in Interfaces above

// src/assets/boxing/registry.ts
import type { BoxPart } from './schema';
const catalog = new Map<string, BoxPart[]>();
export function registerBoxParts(id: string, parts: BoxPart[]): void {
  catalog.set(id, parts);
}
export function getBoxParts(id: string): BoxPart[] | null {
  return catalog.get(id) ?? null;
}
export function listBoxIds(): string[] {
  return [...catalog.keys()].sort();
}

// src/assets/boxing/boxes/weapons/knife.ts
import { registerBoxParts } from '../../registry';
registerBoxParts('knife', [
  { size: [0.12, 0.35, 0.12], position: [0, -0.15, 0], color: 0x5c3a1e, metal: 0.1, rough: 0.9 },
  { size: [0.08, 0.15, 0.55], position: [0, 0.05, -0.4], color: 0xcfd6e0, metal: 0.85, rough: 0.25 },
]);

// src/assets/boxing/loader.ts
import * as THREE from 'three';
import type { BoxingRef, BoxPart } from './schema';
import { getBoxParts } from './registry';

function matFromPart(p: BoxPart): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: p.color,
    metalness: p.metal ?? 0.4,
    roughness: p.rough ?? 0.45,
    emissive: p.emissive ?? 0x000000,
    emissiveIntensity: p.emissiveIntensity ?? 0,
  });
}

function groupFromParts(parts: BoxPart[], material?: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  for (const p of parts) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...p.size),
      material ?? matFromPart(p),
    );
    mesh.position.set(...p.position);
    if (p.rotation) mesh.rotation.set(...p.rotation);
    mesh.castShadow = true;
    g.add(mesh);
  }
  return g;
}

function placeholder(): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff00ff, wireframe: true }),
  );
  g.add(m);
  return g;
}

export function createBoxingModel(ref: BoxingRef): THREE.Group {
  if (ref.type === 'boxes') {
    const parts = getBoxParts(ref.id);
    if (!parts) {
      console.warn(`[boxing] missing boxes id: ${ref.id}`);
      return placeholder();
    }
    return groupFromParts(parts);
  }
  // GLB deferred: use boxes fallback this delivery
  const fb = ref.boxesFallbackId ? getBoxParts(ref.boxesFallbackId) : null;
  if (fb) return groupFromParts(fb);
  console.warn(`[boxing] GLB not loaded, no fallback: ${ref.url}`);
  return placeholder();
}

export function createBoxingModelWithMaterial(
  id: string,
  material: THREE.Material,
): THREE.Group | null {
  const parts = getBoxParts(id);
  if (!parts) return null;
  return groupFromParts(parts, material);
}

// src/assets/boxing/index.ts — re-export schema, registry, loader

// public/boxing/README.md
// Drop future .glb files here. Loader refs use /boxing/<file>.glb
```

Also import the knife module from `src/assets/boxing/index.ts` so registration always runs when the package is imported:

```typescript
import './boxes/weapons/knife';
export * from './schema';
export * from './registry';
export * from './loader';
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/boxingLoader.test.ts && npx tsc --noEmit`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/assets/boxing public/boxing/README.md tests/boxingLoader.test.ts
git commit -m "$(cat <<'EOF'
Add boxing box registry and sync model loader.

EOF
)"
```

---

### Task 2: Port v1 weapon visuals into box catalogs

**Files:**
- Create: `src/assets/boxing/boxes/weapons/pistol.ts`, `shotgun.ts`, `rifle.ts`, and `*_upgraded.ts` (or one file per kind with base+upgraded registers)
- Modify: `src/assets/boxing/index.ts` (import all weapon box modules)
- Modify: `src/domain/weapons/weaponVisuals.ts` — `createWeaponModel` uses loader
- Test: extend `tests/boxingLoader.test.ts`

**Interfaces:**
- Consumes: `createBoxingModel`, `registerBoxParts`
- Produces: box ids matching every current `WeaponId`: `knife`, `pistol`, `pistol_upgraded`, `shotgun`, `shotgun_upgraded`, `rifle`, `rifle_upgraded`
- Keeps: `createWeaponModel(id: WeaponId): THREE.Group` and `weaponIconSvg`

- [ ] **Step 1: Write failing coverage test**

```typescript
import { WEAPON_IDS } from '@/domain/weapons/weapons';
import { getBoxParts } from '@/assets/boxing/registry';
import '@/assets/boxing'; // ensure all registers

it('every v1 weapon id has box parts', () => {
  const v1 = WEAPON_IDS.filter((id) =>
    ['knife', 'pistol', 'pistol_upgraded', 'shotgun', 'shotgun_upgraded', 'rifle', 'rifle_upgraded'].includes(id),
  );
  for (const id of v1) {
    expect(getBoxParts(id)?.length ?? 0, id).toBeGreaterThan(0);
  }
});
```

(After Task 4 expands `WEAPON_IDS`, keep this list explicit as `V1_WEAPON_IDS` in the test, or assert only these seven.)

- [ ] **Step 2: Run — expect FAIL** on missing pistol/etc.

- [ ] **Step 3: Port geometry from `weaponVisuals.ts` `buildKindModel`**

Copy every `BoxGeometry` size/position/color from the current `buildKindModel` into `registerBoxParts('<id>', [...])`. Upgraded variants use the gold materials (`0xd4a017`, emissive, etc.) already in that file.

Then replace `createWeaponModel`:

```typescript
import { createBoxingModel } from '@/assets/boxing';
import { WeaponId, getWeapon } from './weapons';

export function createWeaponModel(id: WeaponId): THREE.Group {
  return createBoxingModel({ type: 'boxes', id });
}
```

Delete unused `buildKindModel` / `mat` helpers once SVG icons no longer need them. Keep `weaponIconSvg` unchanged in this task.

- [ ] **Step 4: Run**

Run: `npx vitest run tests/boxingLoader.test.ts tests/weapons.test.ts tests/playerMuzzle.test.ts && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/assets/boxing src/domain/weapons/weaponVisuals.ts tests/boxingLoader.test.ts
git commit -m "$(cat <<'EOF'
Migrate v1 weapon meshes into boxing box catalogs.

EOF
)"
```

---

### Task 3: New weapon box pieces (sword, shield, longsword, bow)

**Files:**
- Create box modules registering: `sword`, `sword_upgraded`, `shield`, `shield_upgraded`, `longsword`, `longsword_upgraded`, `bow`, `bow_upgraded`
- Note: shop ids are `sword_shield` / `sword_shield_upgraded` (paired). Piece ids stay `sword` + `shield`.
- Modify: `src/assets/boxing/index.ts` imports
- Modify: `src/assets/boxing/manifest.ts` (new) maps shop weapon → piece refs
- Test: `tests/boxingLoader.test.ts`

**Interfaces:**
- Produces:

```typescript
// manifest.ts
export function weaponPieceIds(weaponId: string): { right: string; left?: string } {
  // sword_shield → { right: 'sword', left: 'shield' }
  // sword_shield_upgraded → { right: 'sword_upgraded', left: 'shield_upgraded' }
  // bow → { right: 'bow' }
  // longsword → { right: 'longsword' }
  // default → { right: weaponId }
}
```

Visual intent (blocky, readable at 3rd person):
- **sword:** handle + crossguard + blade along −Z (like knife but longer)
- **shield:** flat disk/box on left hand, facing +Z slightly
- **longsword:** longer blade + two-hand grip block
- **bow:** vertical limb curve approximated with 2–3 boxes + string box; nock near hand
- **\*_upgraded:** same shapes, gold/emissive materials (copy pistol_upgraded palette)

- [ ] **Step 1: Failing test**

```typescript
it('registers new arsenal pieces', () => {
  for (const id of [
    'sword', 'sword_upgraded', 'shield', 'shield_upgraded',
    'longsword', 'longsword_upgraded', 'bow', 'bow_upgraded',
  ]) {
    expect(getBoxParts(id)?.length ?? 0, id).toBeGreaterThan(0);
  }
});

it('weaponPieceIds pairs sword_shield', () => {
  expect(weaponPieceIds('sword_shield')).toEqual({ right: 'sword', left: 'shield' });
  expect(weaponPieceIds('bow')).toEqual({ right: 'bow' });
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement box catalogs + `manifest.ts` + export**

- [ ] **Step 4: Run tests + tsc**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
Add boxing catalogs for bow, swords, and shield pieces.

EOF
)"
```

---

### Task 4: Weapon defs — grip, kinds, shop stats

**Files:**
- Modify: `src/domain/weapons/weapons.ts`
- Modify: `tests/weapons.test.ts`
- Modify: `tests/economy.test.ts` (buy one new weapon)

**Interfaces:**
- Produces updated:

```typescript
export type WeaponKind =
  | 'knife' | 'pistol' | 'shotgun' | 'rifle'
  | 'bow' | 'sword_shield' | 'longsword';

export type WeaponId =
  | 'knife'
  | 'pistol' | 'pistol_upgraded'
  | 'shotgun' | 'shotgun_upgraded'
  | 'rifle' | 'rifle_upgraded'
  | 'sword_shield' | 'sword_shield_upgraded'
  | 'longsword' | 'longsword_upgraded'
  | 'bow' | 'bow_upgraded';

export interface WeaponDef {
  id: WeaponId;
  kind: WeaponKind;
  grip: Grip; // from @/assets/boxing/schema
  name: string;
  price: number;
  damage: number;
  cooldownMs: number;
  range: number;
  isMelee: boolean;
}

export function resolveWeaponId(id: string): WeaponId; // unknown → 'knife'
```

Shop order (exact):

```typescript
export const WEAPON_IDS: WeaponId[] = [
  'knife',
  'sword_shield', 'sword_shield_upgraded',
  'longsword', 'longsword_upgraded',
  'pistol', 'pistol_upgraded',
  'bow', 'bow_upgraded',
  'shotgun', 'shotgun_upgraded',
  'rifle', 'rifle_upgraded',
];
```

Stats from spec §4. All existing weapons get `grip: 'right'`. New melee: `isMelee: true`. Bow: `isMelee: false`, `grip: 'twoHand'`. `sword_shield*`: `grip: 'paired'`. `longsword*`: `grip: 'twoHand'`.

`UPGRADE_SFX_ORDER`: append the six new ids after the rifle pair (recycle `% 4`).

`getWeapon` should use `resolveWeaponId` so bad strings never return `undefined`:

```typescript
export function getWeapon(id: string): WeaponDef {
  return WEAPONS[resolveWeaponId(id)];
}
```

`zombieHpForWave` body **unchanged**.

- [ ] **Step 1: Failing tests**

```typescript
it('exposes new arsenal with grips and shop prices', () => {
  expect(getWeapon('bow').grip).toBe('twoHand');
  expect(getWeapon('bow').isMelee).toBe(false);
  expect(getWeapon('bow').price).toBe(50);
  expect(getWeapon('bow').damage).toBe(50);
  expect(getWeapon('sword_shield').grip).toBe('paired');
  expect(getWeapon('sword_shield').isMelee).toBe(true);
  expect(getWeapon('sword_shield').price).toBe(20);
  expect(getWeapon('longsword').grip).toBe('twoHand');
  expect(getWeapon('longsword_upgraded').damage).toBe(60);
  expect(getWeapon('bow_upgraded').price).toBe(140);
});

it('resolveWeaponId falls back to knife', () => {
  expect(resolveWeaponId('nope')).toBe('knife');
});

it('zombieHpForWave still matches knife/pistol/shotgun curve', () => {
  expect(zombieHpForWave(1)).toBe(WEAPONS.knife.damage * 2);
  expect(zombieHpForWave(5)).toBe(WEAPONS.pistol.damage * 5);
  expect(zombieHpForWave(5)).toBe(WEAPONS.shotgun.damage);
});

// economy.test.ts
it('buys bow when enough coins', () => {
  const r = buyWeapon(60, ['knife'], 'bow');
  expect(r.ok).toBe(true);
});
```

Update upgrade jingle test to include new ids still mapping to 0–3.

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement `weapons.ts` changes**

- [ ] **Step 4: Run** `npx vitest run tests/weapons.test.ts tests/economy.test.ts && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
Add bow and sword arsenal defs with grips for the shop.

EOF
)"
```

---

### Task 5: Dual hand slots + grip-aware `syncWeaponModel`

**Files:**
- Modify: `src/game/world/player.ts`
- Modify: `src/game/world/World.ts` (call sites)
- Modify: `tests/playerMuzzle.test.ts`
- Test: add grip cases to `tests/playerMuzzle.test.ts` or `tests/weaponSync.test.ts`

**Interfaces:**
- Produces:

```typescript
export interface PlayerRig {
  root: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  rightHand: THREE.Group; // was weaponSlot
  leftHand: THREE.Group;
  /** @deprecated alias — keep until World updated in same task */
  weaponSlot: THREE.Group;
  hatSlot: THREE.Group;
  shirtSlot: THREE.Group;
  pantsSlot: THREE.Group;
}

export function syncWeaponModel(
  rig: PlayerRig, // CHANGED: pass whole rig, not only slot
  currentId: WeaponId | null,
  nextId: WeaponId,
): WeaponId;
```

Implementation:

```typescript
export function syncWeaponModel(rig: PlayerRig, currentId: WeaponId | null, nextId: WeaponId): WeaponId {
  const id = resolveWeaponId(nextId);
  if (currentId === id) return id;
  const def = getWeapon(id);
  const pieces = weaponPieceIds(id);
  rig.rightHand.clear();
  rig.leftHand.clear();
  const right = createBoxingModel({ type: 'boxes', id: pieces.right });
  rig.rightHand.add(right);
  if (def.grip === 'paired' && pieces.left) {
    rig.leftHand.add(createBoxingModel({ type: 'boxes', id: pieces.left }));
  }
  // twoHand: single model on rightHand only (left arm pose handled in animate)
  return id;
}
```

In `buildPlayer`: create `leftHand` on left arm at `(0, -0.8, 0)` mirroring right; create empty `hatSlot` / `shirtSlot` / `pantsSlot` groups parented to `root` (positions set in Task 7); set `weaponSlot = rightHand`.

Update World:

```typescript
this.equippedId = syncWeaponModel(this.playerRig, this.equippedId, equipped.id);
// remote:
avatar.weaponId = syncWeaponModel(avatar.rig, avatar.weaponId, weaponId as WeaponId);
```

- [ ] **Step 1: Failing test**

```typescript
it('paired equip fills both hands; right grip clears left', () => {
  const rig = buildPlayer(() => {}, () => {});
  syncWeaponModel(rig, null, 'sword_shield');
  expect(rig.rightHand.children.length).toBe(1);
  expect(rig.leftHand.children.length).toBe(1);
  syncWeaponModel(rig, 'sword_shield', 'pistol');
  expect(rig.rightHand.children.length).toBe(1);
  expect(rig.leftHand.children.length).toBe(0);
});

it('twoHand bow only uses rightHand', () => {
  const rig = buildPlayer(() => {}, () => {});
  syncWeaponModel(rig, null, 'bow');
  expect(rig.rightHand.children.length).toBe(1);
  expect(rig.leftHand.children.length).toBe(0);
});
```

Update `fakeRig` / muzzle test to include `leftHand`, `rightHand`, overlay slots, and `weaponSlot` alias; call `syncWeaponModel(rig, null, 'pistol')` before muzzle assert if needed.

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement**

- [ ] **Step 4: Full vitest + tsc**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
Sync weapons onto right and left hand slots by grip.

EOF
)"
```

---

### Task 6: Grip animation poses

**Files:**
- Modify: `src/game/world/player.ts` `animatePlayer`
- Test: `tests/playerMuzzle.test.ts` (pose smoke)

**Behavior:**
- `grip === 'right'`: keep current logic (melee vs gun via `isMelee`).
- `grip === 'paired'`: right arm = melee swing/idle; left arm nearly still (`rotation.x ≈ -0.15`, `z ≈ 0.2`) for shield; do not swing left with walk heavily.
- `grip === 'twoHand'` + ranged (`bow`): both arms use aim pose (right as today; left mirrors aim with `rotation.x = aimForward`, `z = 0.25`).
- `grip === 'twoHand'` + melee (`longsword`): both arms follow melee attack/idle (left copies right with slight offset).

`rightHand` / `leftHand` local rot for guns: same `gunSlotRot` on `rightHand` as today on `weaponSlot`. For bow, also set `leftHand` to a neutral hold (no extra gun rot unless it looks wrong — tune once visually).

- [ ] **Step 1: Test**

```typescript
it('paired idle keeps left arm near shield tuck', () => {
  const rig = buildPlayer(() => {}, () => {});
  animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('sword_shield'));
  expect(rig.leftArm.rotation.x).toBeLessThan(0.05);
  expect(Math.abs(rig.leftArm.rotation.z)).toBeGreaterThan(0.1);
});

it('bow idle raises both arms to aim', () => {
  const rig = buildPlayer(() => {}, () => {});
  animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('bow'));
  expect(rig.rightArm.rotation.x).toBeGreaterThan(1.0);
  expect(rig.leftArm.rotation.x).toBeGreaterThan(1.0);
});
```

- [ ] **Step 2–4:** implement, test, commit

```bash
git commit -m "$(cat <<'EOF'
Animate paired and two-hand weapon grips on the player rig.

EOF
)"
```

---

### Task 7: Player base catalogs + overlay dummies

**Files:**
- Create base box modules under `src/assets/boxing/boxes/player/base/` (`head`, `torso_boy`, `torso_girl`, `arm`, `leg`, `hair_boy`, `hair_girl`, `skirt` pieces as needed)
- Create overlays: `hat/cap`, `shirt/jersey`, `shirt/armor`, `pants/shinguards`
- Modify: `buildPlayer` to assemble from catalogs + apply skin/cloth materials via `createBoxingModelWithMaterial` where textures matter
- Modify: `PlayerLook` to include overlay ids
- Add: `syncOverlays(rig, look)` or apply inside `buildPlayer`
- Export overlay id unions + `normalizeOverlayId(slot, raw)` in `src/assets/boxing/manifest.ts` or `src/domain/profile/overlays.ts`

**Visual specs for shirt dummies:**
- `jersey`: slightly larger torso box, horizontal chest stripe, small number plate box on chest
- `armor`: chest plate + left/right shoulder pads
- `cap`: brim + crown on head
- `shinguards`: two thin boxes parented into `pantsSlot` positioned over each shin (slot at root; children offset ±x)

`PlayerLook`:

```typescript
export interface PlayerLook {
  sex?: AvatarSex;
  color?: string;
  hatId?: string;
  shirtId?: string;
  pantsId?: string;
}
```

Overlay apply:

```typescript
function clearSlot(slot: THREE.Group) { while (slot.children.length) slot.remove(slot.children[0]!); }
// hat: createBoxingModel boxes id if not none; position hatSlot at head top (~2.45)
// shirt: jersey/armor around torso (~1.35–1.5)
// pants: shinguards
```

Keep girl hair/skirt behavior. Prefer catalogs for mesh sizes; hair can remain multi-mesh catalogs `hair_girl_*` registered as one group id `hair_girl`.

- [ ] **Step 1: Tests**

```typescript
it('overlay catalogs exist', () => {
  for (const id of ['cap', 'jersey', 'armor', 'shinguards']) {
    expect(getBoxParts(id)?.length ?? 0, id).toBeGreaterThan(0);
  }
});

it('buildPlayer attaches jersey into shirtSlot', () => {
  const rig = buildPlayer(() => {}, () => {}, { shirtId: 'jersey' });
  expect(rig.shirtSlot.children.length).toBe(1);
});

it('invalid overlay is ignored', () => {
  const rig = buildPlayer(() => {}, () => {}, { hatId: 'nope' });
  expect(rig.hatSlot.children.length).toBe(0);
});
```

- [ ] **Step 2–4:** implement, verify muzzle + boxing tests still pass, commit

```bash
git commit -m "$(cat <<'EOF'
Build player from boxing parts and attach free overlay dummies.

EOF
)"
```

---

### Task 8: Profile persistence for overlays (local)

**Files:**
- Modify: `src/domain/profile/profile.ts`
- Modify: `tests/profile.test.ts`
- Optional small: `src/domain/profile/overlays.ts` with allowed ids

**Interfaces:**

```typescript
export type HatId = 'none' | 'cap';
export type ShirtId = 'none' | 'jersey' | 'armor';
export type PantsId = 'none' | 'shinguards';

export interface PlayerProfile {
  grade: ChileGrade;
  sex: AvatarSex;
  color: string;
  displayName: string;
  hatId: HatId;
  shirtId: ShirtId;
  pantsId: PantsId;
}

export function normalizeHatId(raw: unknown): HatId;
export function normalizeShirtId(raw: unknown): ShirtId;
export function normalizePantsId(raw: unknown): PantsId;
```

`defaultProfile` → all overlays `'none'`. `loadProfile` / `saveProfile` / `profileFromApi` read/write the three fields (API keys `avatar_hat` etc. in Task 10; for now `profileFromApi` accepts optional `avatar_hat|shirt|pants`).

- [ ] **Step 1: Tests**

```typescript
it('defaults overlays to none', () => {
  expect(defaultProfile().hatId).toBe('none');
});

it('roundtrips overlays', () => {
  const p = { ...defaultProfile(), hatId: 'cap' as const, shirtId: 'jersey' as const, pantsId: 'shinguards' as const };
  saveProfile('kid', p);
  expect(loadProfile('kid')).toEqual(p);
});

it('old saves without overlays become none', () => {
  localStorage.setItem('jdc:profile:old', JSON.stringify({
    grade: '2do', sex: 'boy', color: '#2f6fed', displayName: 'old',
  }));
  // use real STORAGE_PREFIX from gameConfig in test
  expect(loadProfile('old')?.shirtId).toBe('none');
});

it('rejects unknown overlay ids', () => {
  expect(normalizeShirtId('cape')).toBe('none');
  expect(normalizeShirtId('armor')).toBe('armor');
});
```

Fix storage key: read `STORAGE_PREFIX` from `@/config/gameConfig` like production (`${STORAGE_PREFIX}profile:old`).

- [ ] **Step 2–4:** implement, commit

```bash
git commit -m "$(cat <<'EOF'
Persist free avatar overlay ids on the local player profile.

EOF
)"
```

---

### Task 9: Profile UI selectors + preview

**Files:**
- Modify: `src/game/ui/screens/profileScreen.ts`
- Modify: `src/styles/main.css` (minimal row for overlay buttons if needed)
- Modify: `GameSession` / `OnlineGameSession` / World construction to pass overlays from `requireProfile`

**UI:** After color swatches, three rows labeled `Sombrero`, `Camiseta`, `Pantalón` with buttons `Ninguno` + each option (`Gorra`, `Camiseta`, `Armadura`, `Canilleras`). Updating draft calls `preview.setLook({ ...draft overlays })`. Save includes overlay fields in local save and PATCH body.

Pass look into World:

```typescript
{ sex, color, hatId, shirtId, pantsId }
```

Remote rebuild: if peer look overlays change, `removeRemotePlayer` + upsert again OR rebuild — simplest: compare serialized look on avatar; if changed, dispose and recreate.

- [ ] **Step 1:** Manual UI is hard to unit test — add a tiny pure helper if useful:

```typescript
// already have normalize* — covered in Task 8
```

Smoke: `npx tsc --noEmit` and open profile in browser after later tasks. For this task, ensure save payload types compile.

- [ ] **Step 2: Implement UI + look plumbing**

- [ ] **Step 3: tsc + vitest**

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
Add profile overlay pickers wired into the avatar preview.

EOF
)"
```

---

### Task 10: SQL + API profile overlays

**Files:**
- Create: `supabase/migrations/20260812000001_avatar_overlays.sql`
- Modify: `api/players/_profile.ts`
- Modify: `api/players/_register.ts`, `api/players/_recover.ts` select lists
- Modify: `api/admin/_players.ts` if it selects profile cols (optional display)
- Modify: `src/domain/online/playerService.ts` `ProfileApi` type
- Modify: `src/domain/profile/profile.ts` `profileFromApi`

**SQL:**

```sql
alter table players add column if not exists avatar_hat text not null default 'none';
alter table players add column if not exists avatar_shirt text not null default 'none';
alter table players add column if not exists avatar_pants text not null default 'none';
```

**API:** extend `PROFILE_COLS`, `serialize`, PATCH update with normalize (whitelist same as client). Accept body `hatId` / `avatar_hat` (mirror sex/color pattern).

- [ ] **Step 1: Test profileFromApi**

```typescript
it('profileFromApi reads avatar overlay columns', () => {
  const p = profileFromApi({
    grade: '2do',
    avatar_sex: 'girl',
    avatar_color: '#c94c4c',
    display_name: 'hija',
    avatar_hat: 'cap',
    avatar_shirt: 'armor',
    avatar_pants: 'nope',
  });
  expect(p.hatId).toBe('cap');
  expect(p.shirtId).toBe('armor');
  expect(p.pantsId).toBe('none');
});
```

- [ ] **Step 2–4:** implement, commit

```bash
git commit -m "$(cat <<'EOF'
Store avatar overlays on players via SQL and profile API.

EOF
)"
```

---

### Task 11: Coop peer overlays

**Files:**
- Modify: `src/domain/online/matchStore.ts` `PeerState` + `parsePeer`
- Modify: `tests/matchStore.test.ts`
- Modify: `src/game/OnlineGameSession.ts` hello/publish + `upsertRemotePlayer` look
- Modify: `World.upsertRemotePlayer` to refresh avatar when look changes

**PeerState add:** `hatId: string; shirtId: string; pantsId: string` (default `'none'` in parse).

- [ ] **Step 1: Test**

```typescript
it('parses overlay fields on peer', () => {
  const p = parsePeer({
    playerId: 'a', name: 'x', hatId: 'cap', shirtId: 'jersey', pantsId: 'shinguards',
  });
  expect(p?.hatId).toBe('cap');
  expect(p?.shirtId).toBe('jersey');
});

it('defaults missing overlays to none', () => {
  const p = parsePeer({ playerId: 'a', name: 'x' });
  expect(p?.hatId).toBe('none');
});
```

Export `parsePeer` usage — already used inside matchStore; test via `parsePeer` export (already exported).

- [ ] **Step 2–4:** wire OnlineGameSession + World look refresh, commit

```bash
git commit -m "$(cat <<'EOF'
Sync avatar overlays over coop peer payloads.

EOF
)"
```

---

### Task 12: Bow projectile, SFX, shop icons

**Files:**
- Modify: `src/game/world/projectiles.ts`
- Modify: `src/shared/sfx.ts`
- Modify: `src/domain/weapons/weaponVisuals.ts` `weaponIconSvg`
- Modify: `src/game/ui/overlays/shopOverlay.ts` only if it assumes old kinds (should be fine via `WEAPON_IDS`)

**Projectiles:**

```typescript
const kind = equipped.kind;
const count = kind === 'shotgun' ? 10 : 1;
const speed = kind === 'rifle' ? 55 : kind === 'bow' ? 40 : kind === 'shotgun' ? 42 : 48;
// mesh: if bow, thin BoxGeometry(0.05, 0.05, 0.55) oriented along velocity; else sphere as today
```

After creating mesh, if bow: `mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1), dir)`.

**SFX:**

```typescript
if (kind === 'knife' || kind === 'sword_shield' || kind === 'longsword') {
  playTone(240, 70, 'triangle');
  return;
}
if (kind === 'bow') {
  playTone(480, 50, 'triangle');
  playTone(320, 80, 'sine');
  return;
}
// existing pistol/shotgun; default rifle-like for rifle
```

**SVG:** simple bow, sword+shield, longsword icons; gold stroke/fill when `id.includes('_upgraded')`.

- [ ] **Step 1: Test** — projectile creation is Three-heavy; prefer:

```typescript
// tests/sfx.test.ts already exists — extend
it('playGunshot accepts new kinds', () => {
  expect(() => playGunshot('bow')).not.toThrow();
  expect(() => playGunshot('sword_shield')).not.toThrow();
  expect(() => playGunshot('longsword')).not.toThrow();
});

// weapons / icon smoke
it('weaponIconSvg returns svg for new weapons', () => {
  expect(weaponIconSvg('bow')).toContain('<svg');
  expect(weaponIconSvg('sword_shield')).toContain('<svg');
  expect(weaponIconSvg('longsword_upgraded')).toContain('<svg');
});
```

- [ ] **Step 2–4:** implement, commit

```bash
git commit -m "$(cat <<'EOF'
Add bow arrows, melee/bow SFX, and shop icons for new weapons.

EOF
)"
```

---

### Task 13: Final verification + README touch

**Files:**
- Modify: `README.md` structure blurb to mention `src/assets/boxing/` (short)
- Run full suite

- [ ] **Step 1: Run full verification**

```bash
npx vitest run && npx tsc --noEmit
```

Expected: all green.

- [ ] **Step 2: Manual checklist (dev server)**

1. Profile: pick gorra + camiseta + canilleras → preview updates → save → reload still applied.
2. Shop: buy espada+escudo, espada larga, arco (+ upgraded if coins) → equip → both hands / bow pose look OK.
3. Shoot bow → arrow-shaped projectile; swords melee like knife.
4. Offline save with old weapons still loads.
5. Coop (if easy): second client sees overlays + sword+shield.

- [ ] **Step 3: Commit README if changed**

```bash
git commit -m "$(cat <<'EOF'
Document boxing asset layout in the project README.

EOF
)"
```

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| Hybrid boxes/GLB layout + loader | 1 (GLB stub via fallback) |
| `public/boxing/` | 1 |
| Migrate v1 weapon meshes | 2 |
| New piece catalogs | 3 |
| Grip + WeaponKind + shop stats/order | 4 |
| rightHand/leftHand sync, clear left on right | 5 |
| paired / twoHand animation | 6 |
| Base + overlays (jersey/armor/cap/shinguards) | 7 |
| Profile fields free | 8–9 |
| SQL + API | 10 |
| Coop peer overlays | 11 |
| Bow arrow visual, SFX, icons | 12 |
| `zombieHpForWave` unchanged | 4 tests |
| Out of scope (cosmetics economy, real GLB, zombie migrate, shield block) | not scheduled |

## Type consistency notes

- Hand slot name: `rightHand` (+ `weaponSlot` alias only during Task 5 migration; call sites should use `rightHand` / pass full `rig` into `syncWeaponModel`).
- Shop id `sword_shield` ≠ piece id `sword` — always go through `weaponPieceIds`.
- Overlay normalize functions are the single gate for profile, API, and `buildPlayer`.
