import * as THREE from 'three';
import type { AvatarSex } from '@/domain/profile/profile';
import {
  makeClothTexture,
  makeSkinTexture,
} from './textures';
import { createBoxingModel } from '@/assets/boxing';
import {
  normalizeHatId,
  normalizePantsId,
  normalizeShirtId,
  weaponPieceIds,
} from '@/assets/boxing/manifest';
import { getWeapon, resolveWeaponId, type WeaponDef, type WeaponId } from '@/domain/weapons/weapons';

export interface PlayerLook {
  sex?: AvatarSex;
  color?: string;
  hatId?: string;
  shirtId?: string;
  pantsId?: string;
}

function darkenHex(hex: string, amount = 0.22): string {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  if (!Number.isFinite(n)) return '#2558c4';
  const ch = (shift: number) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * (1 - amount))));
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

export interface PlayerRig {
  root: THREE.Group;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  rightHand: THREE.Group;
  leftHand: THREE.Group;
  /** @deprecated alias for rightHand */
  weaponSlot: THREE.Group;
  hatSlot: THREE.Group;
  shirtSlot: THREE.Group;
  /** Root-level pants slot (unused by per-leg overlays like shinguards). */
  pantsSlot: THREE.Group;
  leftPantsSlot: THREE.Group;
  rightPantsSlot: THREE.Group;
}

export const PLAYER_SPEED = 10;
export const PLAYER_JUMP_SPEED = 9;
export const PLAYER_GRAVITY = 24;
export const PLAYER_GROUND_Y = 0;

export function buildPlayer(
  trackTexture: (t: THREE.Texture) => void,
  trackMaterial: (m: THREE.Material) => void,
  look: PlayerLook = {},
): PlayerRig {
  const color = look.color && /^#[0-9a-fA-F]{6}$/.test(look.color) ? look.color : '#2f6fed';
  const girl = look.sex === 'girl';
  const skinTex = makeSkinTexture();
  const shirtTex = makeClothTexture(color, darkenHex(color));
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
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(girl ? 0.72 : 0.85, girl ? 0.72 : 1.05, girl ? 0.48 : 0.5),
    shirt,
  );
  body.position.y = girl ? 1.52 : 1.35;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), skin);
  head.position.y = 2.15;
  head.castShadow = true;

  const hairMat = new THREE.MeshStandardMaterial({
    color: girl ? 0x3a1f0c : 0x3b2414,
    roughness: 0.95,
  });
  trackMaterial(hairMat);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.55, 1.7, 0);
  const la = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), skin);
  la.position.y = -0.35;
  la.castShadow = true;
  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.8, 0);
  leftArm.add(la, leftHand);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.55, 1.7, 0);
  const ra = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.28), skin);
  ra.position.y = -0.35;
  ra.castShadow = true;
  const rightHand = new THREE.Group();
  // At the hand (end of the 0.9-tall arm mesh centered at y=-0.35).
  rightHand.position.set(0, -0.8, 0);
  rightArm.add(ra, rightHand);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.22, 0.85, 0);
  const ll = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.32), girl ? skin : pants);
  ll.position.y = -0.4;
  ll.castShadow = true;
  const leftPantsSlot = new THREE.Group();
  leftPantsSlot.position.set(0, -0.55, 0.08);
  leftLeg.add(ll, leftPantsSlot);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.22, 0.85, 0);
  const rl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, 0.32), girl ? skin : pants);
  rl.position.y = -0.4;
  rl.castShadow = true;
  const rightPantsSlot = new THREE.Group();
  rightPantsSlot.position.set(0, -0.55, 0.08);
  rightLeg.add(rl, rightPantsSlot);

  root.add(body, head, leftArm, rightArm, leftLeg, rightLeg);

  const hatSlot = new THREE.Group();
  hatSlot.position.set(0, 2.45, 0);
  const shirtSlot = new THREE.Group();
  shirtSlot.position.set(0, girl ? 1.52 : 1.35, 0);
  const pantsSlot = new THREE.Group();
  pantsSlot.position.set(0, 0.45, 0);
  root.add(hatSlot, shirtSlot, pantsSlot);

  if (girl) {
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.76), hairMat);
    hairTop.position.set(0, 2.46, -0.06);
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.35, 0.26), hairMat);
    hairBack.position.set(0, 1.78, 0.4);
    const hairLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.24), hairMat);
    hairLeft.position.set(-0.35, 1.78, 0.3);
    const hairRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.24), hairMat);
    hairRight.position.set(0.35, 1.78, 0.3);
    const skirtTex = makeClothTexture(darkenHex(color, 0.08), darkenHex(color, 0.32));
    trackTexture(skirtTex);
    const skirtMat = new THREE.MeshStandardMaterial({ map: skirtTex, roughness: 0.88 });
    trackMaterial(skirtMat);
    const skirtWaist = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.58), skirtMat);
    skirtWaist.position.y = 1.12;
    const skirtHem = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.42, 0.78), skirtMat);
    skirtHem.position.y = 0.78;
    skirtWaist.castShadow = true;
    skirtHem.castShadow = true;
    root.add(hairTop, hairBack, hairLeft, hairRight, skirtWaist, skirtHem);
  } else {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.18, 0.58), hairMat);
    hair.position.y = 2.42;
    root.add(hair);
  }

  const rig: PlayerRig = {
    root,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    rightHand,
    leftHand,
    weaponSlot: rightHand,
    hatSlot,
    shirtSlot,
    pantsSlot,
    leftPantsSlot,
    rightPantsSlot,
  };
  applyOverlays(rig, look);
  return rig;
}

function clearSlot(slot: THREE.Group): void {
  while (slot.children.length) slot.remove(slot.children[0]!);
}

/** Attach free cosmetic overlays (invalid ids → none). */
export function applyOverlays(rig: PlayerRig, look: PlayerLook): void {
  clearSlot(rig.hatSlot);
  clearSlot(rig.shirtSlot);
  clearSlot(rig.pantsSlot);
  clearSlot(rig.leftPantsSlot);
  clearSlot(rig.rightPantsSlot);
  const hatId = normalizeHatId(look.hatId);
  const shirtId = normalizeShirtId(look.shirtId);
  const pantsId = normalizePantsId(look.pantsId);
  if (hatId !== 'none') {
    rig.hatSlot.add(createBoxingModel({ type: 'boxes', id: hatId }));
  }
  if (shirtId !== 'none') {
    rig.shirtSlot.add(createBoxingModel({ type: 'boxes', id: shirtId }));
  }
  if (pantsId === 'shinguards') {
    rig.leftPantsSlot.add(createBoxingModel({ type: 'boxes', id: 'shinguard' }));
    rig.rightPantsSlot.add(createBoxingModel({ type: 'boxes', id: 'shinguard' }));
  } else if (pantsId !== 'none') {
    rig.pantsSlot.add(createBoxingModel({ type: 'boxes', id: pantsId }));
  }
}

export function syncWeaponModel(
  rig: PlayerRig,
  currentId: WeaponId | null,
  nextId: WeaponId,
): WeaponId {
  const id = resolveWeaponId(nextId);
  if (currentId === id) return id;
  const def = getWeapon(id);
  const pieces = weaponPieceIds(id);
  rig.rightHand.clear();
  rig.leftHand.clear();
  const right = createBoxingModel({ type: 'boxes', id: pieces.right });
  right.position.set(0, 0, 0);
  rig.rightHand.add(right);
  if (def.grip === 'paired' && pieces.left) {
    const left = createBoxingModel({ type: 'boxes', id: pieces.left });
    left.position.set(0, 0, 0);
    rig.leftHand.add(left);
  }
  return id;
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
    rig.leftLeg.rotation.x = -0.35;
    rig.rightLeg.rotation.x = -0.2;
  }

  const aimForward = 1.45;
  const aimTuck = -0.25;
  const gunSlotRot = -Math.PI / 2;
  const shieldGuardX = 0.55;
  const shieldGuardZ = 0.45;
  // Right −Z / left +Z tucks hands toward the midline (same sign as aimTuck).
  const twoHandIn = 0.78;
  const grip = equipped.grip;
  const melee = equipped.isMelee;

  const holdShield = () => {
    rig.leftArm.rotation.x = shieldGuardX;
    rig.leftArm.rotation.z = shieldGuardZ;
    // Undo arm pitch so the shield face stays vertical, then yaw so it faces −Z.
    rig.leftHand.rotation.set(-shieldGuardX, Math.PI, 0);
  };

  const holdLongsword = (attackT: number) => {
    if (attackT > 0) {
      rig.rightArm.rotation.x = 0.75 + 0.7 * attackT;
      rig.rightArm.rotation.z = -twoHandIn;
      rig.leftArm.rotation.x = 0.9 + 0.55 * attackT;
      rig.leftArm.rotation.z = twoHandIn;
    } else {
      rig.rightArm.rotation.x = 0.75 + swing * 0.06;
      rig.rightArm.rotation.z = -twoHandIn;
      rig.leftArm.rotation.x = 0.95 + swing * 0.06;
      rig.leftArm.rotation.z = twoHandIn;
    }
    rig.rightHand.rotation.set(0, 0, 0);
    rig.rightHand.position.set(0, -0.8, 0);
    rig.leftHand.rotation.set(0, 0, 0);
    rig.leftHand.position.set(0, -0.8, 0);
  };

  let nextAttack = attackAnim;
  if (nextAttack > 0) {
    nextAttack = Math.max(0, nextAttack - dt * (melee ? 4 : 6));
    const t = nextAttack;
    if (melee) {
      if (grip === 'twoHand') {
        holdLongsword(t);
      } else {
        rig.rightArm.rotation.x = 1.35 * t;
        rig.rightArm.rotation.z = 0.25 * t;
        rig.rightHand.rotation.set(0, 0, 0);
        rig.rightHand.position.set(0, -0.8, 0);
        if (grip === 'paired') {
          holdShield();
        } else {
          rig.leftArm.rotation.x = grounded ? -swing * 0.7 : -0.4;
          rig.leftArm.rotation.z = 0;
          rig.leftHand.rotation.set(0, 0, 0);
        }
      }
    } else {
      rig.rightArm.rotation.x = aimForward - 0.25 * t;
      rig.rightArm.rotation.z = aimTuck;
      rig.rightHand.rotation.set(gunSlotRot, 0, 0);
      rig.rightHand.position.set(0, -0.78, 0.02);
      if (grip === 'twoHand') {
        rig.leftArm.rotation.x = aimForward - 0.2 * t;
        rig.leftArm.rotation.z = 0.25;
      } else {
        rig.leftArm.rotation.x = grounded ? -swing * 0.7 : -0.4;
        rig.leftArm.rotation.z = 0;
      }
      rig.leftHand.rotation.set(0, 0, 0);
    }
  } else if (melee) {
    if (grip === 'twoHand') {
      holdLongsword(0);
    } else if (grip === 'paired') {
      rig.rightArm.rotation.x = swing * 0.7;
      rig.rightArm.rotation.z = 0;
      rig.rightHand.rotation.set(0, 0, 0);
      rig.rightHand.position.set(0, -0.8, 0);
      holdShield();
    } else {
      rig.rightArm.rotation.x = swing * 0.7;
      rig.rightArm.rotation.z = 0;
      rig.rightHand.rotation.set(0, 0, 0);
      rig.rightHand.position.set(0, -0.8, 0);
      rig.leftArm.rotation.x = grounded ? -swing * 0.7 : -0.4;
      rig.leftArm.rotation.z = 0;
      rig.leftHand.rotation.set(0, 0, 0);
    }
  } else {
    rig.rightArm.rotation.x = aimForward + swing * 0.08;
    rig.rightArm.rotation.z = aimTuck;
    rig.rightHand.rotation.set(gunSlotRot, 0, 0);
    rig.rightHand.position.set(0, -0.78, 0.02);
    if (grip === 'twoHand') {
      rig.leftArm.rotation.x = aimForward;
      rig.leftArm.rotation.z = 0.25;
    } else {
      rig.leftArm.rotation.x = grounded ? -swing * 0.7 : -0.4;
      rig.leftArm.rotation.z = 0;
    }
    rig.leftHand.rotation.set(0, 0, 0);
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

/** Same distance the third-person camera looks at — shots must share this point. */
export const CAMERA_LOOK_DISTANCE = 20;

/** World point under the crosshair (same target the camera looks at). */
export function getCrosshairAimPoint(
  playerRoot: THREE.Object3D,
  yaw: number,
  pitch: number,
  distance = CAMERA_LOOK_DISTANCE,
): THREE.Vector3 {
  const look = aimDirection(yaw, pitch);
  const shoulder = playerRoot.position.clone().add(new THREE.Vector3(0, 1.35, 0));
  return shoulder.clone().addScaledVector(look, distance).add(new THREE.Vector3(0, 0.55, 0));
}

/** Barrel tip in weapon-slot local space (models point barrel along local −Z). */
const MUZZLE_LOCAL = new THREE.Vector3(0, 0.02, -0.7);

/** World position of the equipped weapon muzzle (right arm). */
export function getMuzzleWorldPosition(rig: PlayerRig): THREE.Vector3 {
  rig.root.updateWorldMatrix(true, true);
  return MUZZLE_LOCAL.clone().applyMatrix4(rig.rightHand.matrixWorld);
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
  const target = getCrosshairAimPoint(rig.root, yaw, pitch, CAMERA_LOOK_DISTANCE);
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
  const aimPoint = getCrosshairAimPoint(playerRoot, yaw, pitch, CAMERA_LOOK_DISTANCE);
  camera.position.copy(camPos);
  camera.lookAt(aimPoint);
}
