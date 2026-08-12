import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getBoxParts, listBoxIds } from '@/assets/boxing/registry';
import { createBoxingModel, createBoxingModelWithMaterial } from '@/assets/boxing/loader';
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
