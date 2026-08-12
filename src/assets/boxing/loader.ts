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
