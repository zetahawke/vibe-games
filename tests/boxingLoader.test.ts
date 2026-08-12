import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getBoxParts, listBoxIds } from '@/assets/boxing/registry';
import { createBoxingModel, createBoxingModelWithMaterial } from '@/assets/boxing/loader';
import { weaponPieceIds } from '@/assets/boxing/manifest';
import '@/assets/boxing';

const V1_WEAPON_IDS = [
  'knife',
  'pistol',
  'pistol_upgraded',
  'shotgun',
  'shotgun_upgraded',
  'rifle',
  'rifle_upgraded',
] as const;

describe('boxing registry', () => {
  it('registers knife parts', () => {
    expect(getBoxParts('knife')?.length).toBeGreaterThan(0);
    expect(listBoxIds()).toContain('knife');
  });

  it('every v1 weapon id has box parts', () => {
    for (const id of V1_WEAPON_IDS) {
      expect(getBoxParts(id)?.length ?? 0, id).toBeGreaterThan(0);
    }
  });

  it('registers new arsenal pieces', () => {
    for (const id of [
      'sword', 'sword_upgraded', 'shield', 'shield_upgraded',
      'longsword', 'longsword_upgraded', 'bow', 'bow_upgraded',
    ]) {
      expect(getBoxParts(id)?.length ?? 0, id).toBeGreaterThan(0);
    }
  });

  it('overlay catalogs exist', () => {
    for (const id of ['cap', 'jersey', 'armor', 'shinguards']) {
      expect(getBoxParts(id)?.length ?? 0, id).toBeGreaterThan(0);
    }
  });
});

describe('weaponPieceIds', () => {
  it('pairs sword_shield and maps twoHand pieces', () => {
    expect(weaponPieceIds('sword_shield')).toEqual({ right: 'sword', left: 'shield' });
    expect(weaponPieceIds('bow')).toEqual({ right: 'bow' });
    expect(weaponPieceIds('pistol')).toEqual({ right: 'pistol' });
  });
});

describe('weapon facing conventions', () => {
  it('bow curves toward −Z (target) with string on +Z (wielder)', () => {
    const parts = getBoxParts('bow') ?? [];
    const string = parts.find((p) => p.size[0] <= 0.02 && p.size[2] <= 0.02);
    const limb = parts.find((p) => p.rotation != null);
    expect(string).toBeTruthy();
    expect(limb).toBeTruthy();
    expect(string!.position[2]).toBeGreaterThan(0);
    expect(limb!.position[2]).toBeLessThan(0);
  });

  it('shield face is larger than a torso plate', () => {
    const parts = getBoxParts('shield') ?? [];
    const face = parts.reduce((best, p) =>
      p.size[0] * p.size[1] > best.size[0] * best.size[1] ? p : best,
    );
    expect(face.size[0]).toBeGreaterThanOrEqual(0.75);
    expect(face.size[1]).toBeGreaterThanOrEqual(0.9);
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
