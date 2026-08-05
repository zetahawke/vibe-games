import * as THREE from 'three';
import { makeZombieTexture } from './textures';

export interface Zombie {
  root: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  hp: number;
  hpMax: number;
  /** performance.now() timestamp until which the HP bar should be visible. */
  hpShowUntil: number;
  speed: number;
  walkPhase: number;
}

export const BASE_ZOMBIE_SPEED = 1.85;

export function buildZombie(
  trackTexture: (t: THREE.Texture) => void,
  trackMaterial: (m: THREE.Material) => void,
): Zombie {
  const tex = makeZombieTexture();
  trackTexture(tex);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  trackMaterial(mat);
  const dark = new THREE.MeshStandardMaterial({ color: 0x2f3d28, roughness: 0.95 });
  trackMaterial(dark);

  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), mat);
  body.position.y = 1.35;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.55), mat);
  head.position.y = 2.15;
  head.castShadow = true;

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.55, 1.75, 0);
  const la = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.95, 0.26), mat);
  la.position.y = -0.4;
  leftArm.add(la);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.55, 1.75, 0);
  const ra = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.95, 0.26), mat);
  ra.position.y = -0.4;
  rightArm.add(ra);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.22, 0.85, 0);
  const ll = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.32), dark);
  ll.position.y = -0.4;
  leftLeg.add(ll);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.22, 0.85, 0);
  const rl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.32), dark);
  rl.position.y = -0.4;
  rightLeg.add(rl);

  root.add(body, head, leftArm, rightArm, leftLeg, rightLeg);
  return {
    root,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    hp: 1,
    hpMax: 1,
    hpShowUntil: 0,
    speed: BASE_ZOMBIE_SPEED,
    walkPhase: Math.random() * Math.PI * 2,
  };
}

export function animateZombieWalk(z: Zombie, dt: number): void {
  z.walkPhase += dt * (6 + z.speed);
  const swing = Math.sin(z.walkPhase) * 0.55;
  z.leftLeg.rotation.x = swing;
  z.rightLeg.rotation.x = -swing;
  z.leftArm.rotation.x = -swing * 0.8;
  z.rightArm.rotation.x = swing * 0.8;
}
