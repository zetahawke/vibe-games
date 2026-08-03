import * as THREE from 'three';
import {
  makeClothTexture,
  makeSkinTexture,
} from './textures';
import { createWeaponModel } from '@/domain/weapons/weaponVisuals';
import type { WeaponDef, WeaponId } from '@/domain/weapons/weapons';

export interface PlayerRig {
  root: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  weaponSlot: THREE.Group;
}

export const PLAYER_SPEED = 8;

export function buildPlayer(
  trackTexture: (t: THREE.Texture) => void,
  trackMaterial: (m: THREE.Material) => void,
): PlayerRig {
  const skinTex = makeSkinTexture();
  const shirtTex = makeClothTexture('#2f6fed', '#2558c4');
  const pantsTex = makeClothTexture('#2a3a55', '#1d2a3f');
  trackTexture(skinTex);
  trackTexture(shirtTex);
  trackTexture(pantsTex);

  const skin = new THREE.MeshStandardMaterial({ map: skinTex, roughness: 0.7 });
  const shirt = new THREE.MeshStandardMaterial({ map: shirtTex, roughness: 0.85 });
  const pants = new THREE.MeshStandardMaterial({ map: pantsTex, roughness: 0.9 });
  trackMaterial(skin);
  trackMaterial(shirt);
  trackMaterial(pants);

  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 0.5), shirt);
  body.position.y = 1.35;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), skin);
  head.position.y = 2.15;
  head.castShadow = true;

  const hair = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.18, 0.58),
    new THREE.MeshStandardMaterial({ color: 0x3b2414, roughness: 0.95 }),
  );
  hair.position.y = 2.42;

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.55, 1.7, 0);
  const la = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), skin);
  la.position.y = -0.35;
  la.castShadow = true;
  leftArm.add(la);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.55, 1.7, 0);
  const ra = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), skin);
  ra.position.y = -0.35;
  ra.castShadow = true;
  const weaponSlot = new THREE.Group();
  weaponSlot.position.set(0, -0.35, -0.2);
  rightArm.add(ra, weaponSlot);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.22, 0.85, 0);
  const ll = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 0.35), pants);
  ll.position.y = -0.4;
  ll.castShadow = true;
  leftLeg.add(ll);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.22, 0.85, 0);
  const rl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 0.35), pants);
  rl.position.y = -0.4;
  rl.castShadow = true;
  rightLeg.add(rl);

  root.add(body, head, hair, leftArm, rightArm, leftLeg, rightLeg);
  return { root, leftArm, rightArm, leftLeg, rightLeg, weaponSlot };
}

export function syncWeaponModel(
  slot: THREE.Group,
  currentId: WeaponId | null,
  nextId: WeaponId,
): WeaponId {
  if (currentId === nextId) return currentId;
  slot.clear();
  const model = createWeaponModel(nextId);
  model.position.set(0, -0.55, -0.15);
  slot.add(model);
  return nextId;
}

export function animatePlayer(
  rig: PlayerRig,
  walkPhase: number,
  attackAnim: number,
  moving: boolean,
  dt: number,
  equipped: WeaponDef,
): number {
  const swing = moving ? Math.sin(walkPhase) * 0.65 : 0;
  rig.leftLeg.rotation.x = swing;
  rig.rightLeg.rotation.x = -swing;
  rig.leftArm.rotation.x = -swing * 0.7;

  let nextAttack = attackAnim;
  if (nextAttack > 0) {
    nextAttack = Math.max(0, nextAttack - dt * (equipped.isMelee ? 4 : 6));
    const t = nextAttack;
    if (equipped.isMelee) {
      rig.rightArm.rotation.x = 1.35 * t;
      rig.rightArm.rotation.z = 0.25 * t;
    } else {
      rig.rightArm.rotation.x = -0.45 * t;
      rig.weaponSlot.position.z = 0.08 * t;
    }
  } else {
    rig.rightArm.rotation.x = swing * 0.7;
    rig.rightArm.rotation.z = 0;
    rig.weaponSlot.position.z = 0;
  }
  return nextAttack;
}

export function aimDirection(yaw: number, pitch: number): THREE.Vector3 {
  return new THREE.Vector3(
    -Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch),
  ).normalize();
}

export function updateThirdPersonCamera(
  camera: THREE.PerspectiveCamera,
  playerRoot: THREE.Object3D,
  yaw: number,
  pitch: number,
): void {
  const look = aimDirection(yaw, pitch);
  const focus = playerRoot.position.clone().add(new THREE.Vector3(0, 1.55, 0));
  camera.position.copy(focus).addScaledVector(look, -7.2);
  camera.lookAt(focus.clone().addScaledVector(look, 14));
}
