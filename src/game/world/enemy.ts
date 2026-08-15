import * as THREE from 'three';
import type { EnemyDef, EnemyType } from '@/domain/waves/enemyConfig';
import { ENEMY_DEFS } from '@/domain/waves/enemyConfig';
import { makeZombieTexture } from './textures';

export const BASE_ZOMBIE_SPEED = 2.22;

export interface Enemy {
  root: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  hp: number;
  hpMax: number;
  hpShowUntil: number;
  speed: number;
  walkPhase: number;
  type: EnemyType;
  /** Shared id across co-op clients. 0 = unassigned (solo). */
  netId: number;
}

function buildBodyMesh(def: EnemyDef, trackMat: (m: THREE.Material) => void) {
  const mat = new THREE.MeshStandardMaterial({ color: def.bodyColor, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: def.darkColor, roughness: 0.95 });
  trackMat(mat);
  trackMat(dark);
  return { mat, dark };
}

export function buildEnemy(
  type: EnemyType,
  trackTexture: (t: THREE.Texture) => void,
  trackMaterial: (m: THREE.Material) => void,
): Enemy {
  const def = ENEMY_DEFS[type];
  let mat: THREE.MeshStandardMaterial;
  let dark: THREE.MeshStandardMaterial;
  if (type === 'zombie') {
    const tex = makeZombieTexture();
    trackTexture(tex);
    mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    dark = new THREE.MeshStandardMaterial({ color: def.darkColor, roughness: 0.95 });
    trackMaterial(mat);
    trackMaterial(dark);
  } else {
    ({ mat, dark } = buildBodyMesh(def, trackMaterial));
  }

  const root = new THREE.Group();
  const s = def.scale;

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9 * s, 1.1 * s, 0.5 * s), mat);
  body.position.y = 1.35 * s;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.55 * s, 0.55 * s), mat);
  head.position.y = 2.15 * s;
  head.castShadow = true;

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.55 * s, 1.75 * s, 0);
  const la = new THREE.Mesh(new THREE.BoxGeometry(0.26 * s, 0.95 * s, 0.26 * s), mat);
  la.position.y = -0.4 * s;
  leftArm.add(la);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.55 * s, 1.75 * s, 0);
  const ra = new THREE.Mesh(new THREE.BoxGeometry(0.26 * s, 0.95 * s, 0.26 * s), mat);
  ra.position.y = -0.4 * s;
  rightArm.add(ra);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.22 * s, 0.85 * s, 0);
  const ll = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.85 * s, 0.32 * s), dark);
  ll.position.y = -0.4 * s;
  leftLeg.add(ll);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.22 * s, 0.85 * s, 0);
  const rl = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.85 * s, 0.32 * s), dark);
  rl.position.y = -0.4 * s;
  rightLeg.add(rl);

  root.add(body, head, leftArm, rightArm, leftLeg, rightLeg);

  return {
    root, leftArm, rightArm, leftLeg, rightLeg,
    hp: 1, hpMax: 1, hpShowUntil: 0,
    speed: BASE_ZOMBIE_SPEED * def.speedFactor,
    walkPhase: Math.random() * Math.PI * 2,
    type,
    netId: 0,
  };
}

export function animateEnemyWalk(e: Enemy, dt: number): void {
  e.walkPhase += dt * (6 + e.speed);
  const swing = Math.sin(e.walkPhase) * 0.55;
  e.leftLeg.rotation.x = swing;
  e.rightLeg.rotation.x = -swing;
  e.leftArm.rotation.x = -swing * 0.8;
  e.rightArm.rotation.x = swing * 0.8;
}
