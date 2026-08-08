import * as THREE from 'three';
import { WeaponId, getWeapon, type WeaponKind } from '@/domain/weapons/weapons';

function mat(
  color: number,
  metal = 0.4,
  rough = 0.45,
  emissive = 0x000000,
  emissiveIntensity = 0,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: metal,
    roughness: rough,
    emissive,
    emissiveIntensity,
  });
}

function buildKindModel(kind: WeaponKind, upgraded: boolean): THREE.Group {
  const g = new THREE.Group();

  if (!upgraded) {
    if (kind === 'knife') {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), mat(0x5c3a1e, 0.1, 0.9));
      handle.position.set(0, -0.15, 0);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.55), mat(0xcfd6e0, 0.85, 0.25));
      blade.position.set(0, 0.05, -0.4);
      g.add(handle, blade);
    } else if (kind === 'pistol') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.45), mat(0x2b2b2b, 0.5, 0.4));
      body.position.set(0, 0, -0.25);
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.28), mat(0x444444, 0.7, 0.3));
      barrel.position.set(0, 0.02, -0.55);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.16), mat(0x1a1a1a, 0.2, 0.7));
      grip.position.set(0, -0.22, -0.1);
      g.add(body, barrel, grip);
    } else if (kind === 'shotgun') {
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.4), mat(0x6b3e1f, 0.1, 0.85));
      stock.position.set(0, -0.05, 0.05);
      const tube = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.85), mat(0x444444, 0.65, 0.35));
      tube.position.set(0, 0.02, -0.5);
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.28), mat(0x2b2b2b, 0.4, 0.5));
      pump.position.set(0, -0.08, -0.25);
      g.add(stock, tube, pump);
    } else {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.7), mat(0x2f3d2f, 0.45, 0.4));
      body.position.set(0, 0, -0.35);
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.55), mat(0x444444, 0.75, 0.28));
      barrel.position.set(0, 0.04, -0.85);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.35), mat(0x6b3e1f, 0.1, 0.85));
      stock.position.set(0, -0.02, 0.15);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.16), mat(0x222222, 0.3, 0.6));
      mag.position.set(0, -0.2, -0.2);
      g.add(body, barrel, stock, mag);
    }
  } else {
    // Upgraded: vivid gold with emissive so it reads as yellow regardless of lighting.
    const goldBody  = mat(0xd4a017, 0.75, 0.25, 0xd4a017, 0.18);
    const goldShine = mat(0xffd700, 0.85, 0.15, 0xffd700, 0.30);
    const darkGold  = mat(0x7a5a00, 0.65, 0.35);
    const warmWood  = mat(0x9a6030, 0.05, 0.85);

    if (kind === 'knife') {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), warmWood);
      handle.position.set(0, -0.15, 0);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.55), goldShine);
      blade.position.set(0, 0.05, -0.4);
      g.add(handle, blade);
    } else if (kind === 'pistol') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.45), goldBody);
      body.position.set(0, 0, -0.25);
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.28), goldShine);
      barrel.position.set(0, 0.02, -0.55);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.16), darkGold);
      grip.position.set(0, -0.22, -0.1);
      g.add(body, barrel, grip);
    } else if (kind === 'shotgun') {
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.4), warmWood);
      stock.position.set(0, -0.05, 0.05);
      const tube = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.85), goldShine);
      tube.position.set(0, 0.02, -0.5);
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.28), goldBody);
      pump.position.set(0, -0.08, -0.25);
      g.add(stock, tube, pump);
    } else {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.7), goldBody);
      body.position.set(0, 0, -0.35);
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.55), goldShine);
      barrel.position.set(0, 0.04, -0.85);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.35), warmWood);
      stock.position.set(0, -0.02, 0.15);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.16), darkGold);
      mag.position.set(0, -0.2, -0.2);
      g.add(body, barrel, stock, mag);
    }
  }
  return g;
}

/** Distinct blocky models for each weapon (Roblox-like). */
export function createWeaponModel(id: WeaponId): THREE.Group {
  const def = getWeapon(id);
  const g = buildKindModel(def.kind, id.includes('_upgraded'));
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  return g;
}

/** Simple SVG icon for shop/inventory. */
export function weaponIconSvg(id: WeaponId): string {
  const kind = getWeapon(id).kind;
  const accent = id.includes('_upgraded') ? '#c9a227' : null;
  if (kind === 'knife') {
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="28" y="34" width="8" height="22" rx="2" fill="#6b3a1f"/><polygon points="32,6 38,34 26,34" fill="#cfd6e0"/></svg>`;
  }
  if (kind === 'pistol') {
    const fill = accent ?? '#2b2b2b';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="24" width="36" height="14" rx="3" fill="${fill}"/><rect x="40" y="28" width="16" height="6" fill="#555"/><rect x="14" y="38" width="12" height="18" rx="2" fill="#1a1a1a"/></svg>`;
  }
  if (kind === 'shotgun') {
    const fill = accent ?? '#3a3a3a';
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="28" width="50" height="10" rx="3" fill="${fill}"/><rect x="6" y="36" width="18" height="12" rx="2" fill="#6b3e1f"/><rect x="28" y="34" width="14" height="8" fill="#4a4a4a"/></svg>`;
  }
  const fill = accent ?? '#2f3d2f';
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="26" width="42" height="10" rx="2" fill="${fill}"/><rect x="40" y="28" width="18" height="6" fill="#555"/><rect x="8" y="36" width="14" height="16" rx="2" fill="#4a3020"/><rect x="24" y="36" width="10" height="14" fill="#222"/></svg>`;
}
