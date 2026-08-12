import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  animatePlayer,
  getMuzzleWorldPosition,
  syncWeaponModel,
  type PlayerRig,
} from '@/game/world/player';
import { getWeapon } from '@/domain/weapons/weapons';
import { getBoxParts } from '@/assets/boxing/registry';
import '@/assets/boxing';

function fakeRig(): PlayerRig {
  const root = new THREE.Group();
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.55, 1.7, 0);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.55, 1.7, 0);
  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.8, 0);
  rightArm.add(rightHand);
  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.8, 0);
  leftArm.add(leftHand);
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.22, 0.85, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.22, 0.85, 0);
  const hatSlot = new THREE.Group();
  hatSlot.position.set(0, 2.45, 0);
  const shirtSlot = new THREE.Group();
  const pantsSlot = new THREE.Group();
  const leftPantsSlot = new THREE.Group();
  leftLeg.add(leftPantsSlot);
  const rightPantsSlot = new THREE.Group();
  rightLeg.add(rightPantsSlot);
  root.add(leftArm, rightArm, leftLeg, rightLeg, hatSlot, shirtSlot, pantsSlot);
  return {
    root, leftArm, rightArm, leftLeg, rightLeg,
    rightHand, leftHand, weaponSlot: rightHand,
    hatSlot, shirtSlot, pantsSlot, leftPantsSlot, rightPantsSlot,
  };
}

function alongBodyForward(rig: PlayerRig, p: THREE.Vector3): number {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
    rig.root.getWorldQuaternion(new THREE.Quaternion()),
  );
  const origin = new THREE.Vector3();
  rig.root.getWorldPosition(origin);
  return p.clone().sub(origin).dot(forward);
}

describe('player facing convention', () => {
  it('local −Z is forward: cap brim sits ahead of the body', () => {
    const rig = fakeRig();
    animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('knife'));
    const brimMesh = new THREE.Object3D();
    brimMesh.position.set(0, -0.02, -0.4);
    rig.hatSlot.add(brimMesh);
    rig.root.rotation.y = 0;
    rig.root.updateMatrixWorld(true);
    const brim = new THREE.Vector3();
    brimMesh.getWorldPosition(brim);
    expect(alongBodyForward(rig, brim)).toBeGreaterThan(0.2);
  });

  it('pistol muzzle sits in front of the chest, not behind', () => {
    const rig = fakeRig();
    syncWeaponModel(rig, null, 'pistol');
    animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('pistol'));
    rig.root.rotation.y = 0;
    rig.root.updateMatrixWorld(true);
    const muzzle = getMuzzleWorldPosition(rig);
    const hand = new THREE.Vector3();
    rig.rightHand.getWorldPosition(hand);
    expect(alongBodyForward(rig, muzzle)).toBeGreaterThan(alongBodyForward(rig, hand));
    expect(alongBodyForward(rig, muzzle)).toBeGreaterThan(0.3);
  });

  it('bow: grip near hand, limbs further forward than string (toward target)', () => {
    const rig = fakeRig();
    syncWeaponModel(rig, null, 'bow');
    animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('bow'));
    rig.root.rotation.y = 0;
    rig.root.updateMatrixWorld(true);

    const bow = rig.rightHand.children[0]!;
    const parts = getBoxParts('bow')!;
    const stringDef = parts.find((p) => p.size[0] <= 0.02)!;
    const tipLimb = parts
      .filter((p) => p.rotation != null)
      .reduce((best, p) => (Math.abs(p.position[2]) > Math.abs(best.position[2]) ? p : best));
    const stringW = new THREE.Vector3(...stringDef.position);
    const limbW = new THREE.Vector3(...tipLimb.position);
    const gripW = new THREE.Vector3(0, 0, 0);
    bow.localToWorld(stringW);
    bow.localToWorld(limbW);
    bow.localToWorld(gripW);

    const hand = new THREE.Vector3();
    rig.rightHand.getWorldPosition(hand);

    expect(gripW.distanceTo(hand)).toBeLessThan(0.15);
    expect(alongBodyForward(rig, limbW)).toBeGreaterThan(alongBodyForward(rig, stringW));
    // String stays between body and hand; limbs past the hand.
    expect(alongBodyForward(rig, stringW)).toBeLessThan(alongBodyForward(rig, hand));
    expect(alongBodyForward(rig, limbW)).toBeGreaterThan(alongBodyForward(rig, hand));
  });

  it('armor chest plate sits on −Z (front), not the back', () => {
    const parts = getBoxParts('armor') ?? [];
    const plate = parts.find((p) => p.color === 0xc9a227);
    expect(plate).toBeTruthy();
    expect(plate!.position[2]).toBeLessThan(0);
  });
});
