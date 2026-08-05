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

export const PLAYER_SPEED = 10;
export const PLAYER_JUMP_SPEED = 9;
export const PLAYER_GRAVITY = 24;
export const PLAYER_GROUND_Y = 0;

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
  // At the hand (end of the 0.9-tall arm mesh centered at y=-0.35).
  weaponSlot.position.set(0, -0.8, 0);
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
  model.position.set(0, 0, 0);
  slot.add(model);
  return nextId;
}

/** Shortest-path angle blend for body facing. */
export function lerpAngle(from: number, to: number, t: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return from + d * t;
}

/** Yaw so local −Z faces the given horizontal move vector. */
export function yawFacingMove(moveX: number, moveZ: number): number {
  return Math.atan2(-moveX, -moveZ);
}

export function animatePlayer(
  rig: PlayerRig,
  walkPhase: number,
  attackAnim: number,
  moving: boolean,
  grounded: boolean,
  dt: number,
  equipped: WeaponDef,
): number {
  const swing = moving && grounded ? Math.sin(walkPhase) * 0.65 : 0;
  if (grounded) {
    rig.leftLeg.rotation.x = swing;
    rig.rightLeg.rotation.x = -swing;
  } else {
    // Light tuck while airborne
    rig.leftLeg.rotation.x = -0.35;
    rig.rightLeg.rotation.x = -0.2;
  }
  rig.leftArm.rotation.x = grounded ? -swing * 0.7 : -0.4;

  // Raise arm forward (~horizontal) and rotate the slot so the barrel
  // points along the arm (models are built with barrel on local −Z).
  const aimForward = 1.45;
  const aimTuck = -0.25; // right arm slightly toward center, not out to the side
  const gunSlotRot = -Math.PI / 2;

  let nextAttack = attackAnim;
  if (nextAttack > 0) {
    nextAttack = Math.max(0, nextAttack - dt * (equipped.isMelee ? 4 : 6));
    const t = nextAttack;
    if (equipped.isMelee) {
      rig.rightArm.rotation.x = 1.35 * t;
      rig.rightArm.rotation.z = 0.25 * t;
      rig.weaponSlot.rotation.set(0, 0, 0);
      rig.weaponSlot.position.set(0, -0.8, 0);
    } else {
      rig.rightArm.rotation.x = aimForward - 0.25 * t;
      rig.rightArm.rotation.z = aimTuck;
      rig.weaponSlot.rotation.set(gunSlotRot, 0, 0);
      rig.weaponSlot.position.set(0, -0.78, 0.02);
    }
  } else if (equipped.isMelee) {
    rig.rightArm.rotation.x = swing * 0.7;
    rig.rightArm.rotation.z = 0;
    rig.weaponSlot.rotation.set(0, 0, 0);
    rig.weaponSlot.position.set(0, -0.8, 0);
  } else {
    rig.rightArm.rotation.x = aimForward + swing * 0.08;
    rig.rightArm.rotation.z = aimTuck;
    rig.weaponSlot.rotation.set(gunSlotRot, 0, 0);
    rig.weaponSlot.position.set(0, -0.78, 0.02);
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

/** World point under the crosshair (same target the camera looks at). */
export function getCrosshairAimPoint(
  playerRoot: THREE.Object3D,
  yaw: number,
  pitch: number,
  distance = 40,
): THREE.Vector3 {
  const look = aimDirection(yaw, pitch);
  const shoulder = playerRoot.position.clone().add(new THREE.Vector3(0, 1.35, 0));
  return shoulder.clone().addScaledVector(look, distance).add(new THREE.Vector3(0, 0.55, 0));
}

/** Barrel tip in weapon-slot local space (after aim slot rotation −π/2, barrel is −Y). */
const MUZZLE_LOCAL = new THREE.Vector3(0, -0.85, 0);

/** World position of the equipped weapon muzzle (right arm). */
export function getMuzzleWorldPosition(rig: PlayerRig): THREE.Vector3 {
  rig.root.updateWorldMatrix(true, true);
  return MUZZLE_LOCAL.clone().applyMatrix4(rig.weaponSlot.matrixWorld);
}

/**
 * Direction from muzzle toward the crosshair aim point so shots
 * visually leave the gun but fly true to the mira.
 */
export function muzzleAimDirection(
  rig: PlayerRig,
  yaw: number,
  pitch: number,
): { origin: THREE.Vector3; direction: THREE.Vector3 } {
  const origin = getMuzzleWorldPosition(rig);
  const target = getCrosshairAimPoint(rig.root, yaw, pitch);
  const direction = target.sub(origin).normalize();
  return { origin, direction };
}

export function updateThirdPersonCamera(
  camera: THREE.PerspectiveCamera,
  playerRoot: THREE.Object3D,
  yaw: number,
  pitch: number,
): void {
  const look = aimDirection(yaw, pitch);
  // Shoulder pivot: camera sits higher behind so the body stays in the lower frame
  // and screen-center (crosshair) aims over the head toward distant targets.
  const shoulder = playerRoot.position.clone().add(new THREE.Vector3(0, 1.35, 0));
  const camPos = shoulder
    .clone()
    .addScaledVector(look, -6.4)
    .add(new THREE.Vector3(0, 2.35, 0));
  const aimPoint = getCrosshairAimPoint(playerRoot, yaw, pitch, 20);
  camera.position.copy(camPos);
  camera.lookAt(aimPoint);
}
