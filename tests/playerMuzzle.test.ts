import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getWeapon } from '@/domain/weapons/weapons';
import {
  animatePlayer,
  applyOverlays,
  getMuzzleWorldPosition,
  syncWeaponModel,
  type PlayerRig,
} from '@/game/world/player';
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
  const shirtSlot = new THREE.Group();
  const pantsSlot = new THREE.Group();
  const leftPantsSlot = new THREE.Group();
  leftPantsSlot.position.set(0, -0.55, 0.08);
  leftLeg.add(leftPantsSlot);
  const rightPantsSlot = new THREE.Group();
  rightPantsSlot.position.set(0, -0.55, 0.08);
  rightLeg.add(rightPantsSlot);
  const hairSlot = new THREE.Group();
  root.add(leftArm, rightArm, leftLeg, rightLeg, hatSlot, shirtSlot, pantsSlot, hairSlot);
  return {
    root, leftArm, rightArm, leftLeg, rightLeg,
    rightHand, leftHand, weaponSlot: rightHand,
    hatSlot, shirtSlot, pantsSlot, leftPantsSlot, rightPantsSlot,
    hairSlot, defaultHair: [],
  };
}

describe('getMuzzleWorldPosition', () => {
  it('sits near chest height when the pistol is raised', () => {
    const rig = fakeRig();
    syncWeaponModel(rig, null, 'pistol');
    animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('pistol'));
    const muzzle = getMuzzleWorldPosition(rig);
    expect(muzzle.y).toBeGreaterThan(1.35);
    expect(muzzle.y).toBeLessThan(2.15);
  });
});

describe('syncWeaponModel', () => {
  it('paired equip fills both hands; right grip clears left', () => {
    const rig = fakeRig();
    syncWeaponModel(rig, null, 'sword_shield');
    expect(rig.rightHand.children.length).toBe(1);
    expect(rig.leftHand.children.length).toBe(1);
    syncWeaponModel(rig, 'sword_shield', 'pistol');
    expect(rig.rightHand.children.length).toBe(1);
    expect(rig.leftHand.children.length).toBe(0);
  });

  it('twoHand bow only uses rightHand', () => {
    const rig = fakeRig();
    syncWeaponModel(rig, null, 'bow');
    expect(rig.rightHand.children.length).toBe(1);
    expect(rig.leftHand.children.length).toBe(0);
  });
});

describe('applyOverlays', () => {
  it('attaches jersey into shirtSlot', () => {
    const rig = fakeRig();
    applyOverlays(rig, { shirtId: 'jersey' });
    expect(rig.shirtSlot.children.length).toBe(1);
  });

  it('ignores invalid overlay ids', () => {
    const rig = fakeRig();
    applyOverlays(rig, { hatId: 'nope' });
    expect(rig.hatSlot.children.length).toBe(0);
  });
});

describe('animatePlayer grips', () => {
  it('paired idle raises left arm for shield guard', () => {
    const rig = fakeRig();
    animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('sword_shield'));
    expect(rig.leftArm.rotation.x).toBeGreaterThan(0.35);
    expect(Math.abs(rig.leftArm.rotation.z)).toBeGreaterThan(0.1);
  });

  it('paired shield stays upright facing forward', () => {
    const rig = fakeRig();
    animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('sword_shield'));
    // Counter-rotate the hand so the shield face is not flat toward the knees.
    expect(rig.leftHand.rotation.x).toBeCloseTo(-rig.leftArm.rotation.x, 5);
    expect(Math.abs(rig.leftHand.rotation.y)).toBeGreaterThan(1.5);
  });

  it('paired attack swings only the sword arm', () => {
    const rig = fakeRig();
    animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('sword_shield'));
    const idleLeftX = (rig.leftArm as THREE.Object3D).rotation.x;
    const idleLeftZ = (rig.leftArm as THREE.Object3D).rotation.z;
    animatePlayer(rig, 0, 1, false, true, 0, getWeapon('sword_shield'));
    expect((rig.leftArm as THREE.Object3D).rotation.x).toBeCloseTo(idleLeftX, 5);
    expect((rig.leftArm as THREE.Object3D).rotation.z).toBeCloseTo(idleLeftZ, 5);
    expect((rig.rightArm as THREE.Object3D).rotation.x).toBeGreaterThan(1.0);
  });

  it('longsword idle keeps both hands near the grip in front', () => {
    const rig = fakeRig();
    animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('longsword'));
    rig.root.updateMatrixWorld(true);
    const rh = new THREE.Vector3();
    const lh = new THREE.Vector3();
    rig.rightHand.getWorldPosition(rh);
    rig.leftHand.getWorldPosition(lh);
    expect(rh.distanceTo(lh)).toBeLessThan(0.45);
    expect((rh.z + lh.z) / 2).toBeLessThan(-0.15);
  });

  it('longsword attack swings both arms together', () => {
    const rig = fakeRig();
    animatePlayer(rig, 0, 1, false, true, 0, getWeapon('longsword'));
    expect(rig.rightArm.rotation.x).toBeGreaterThan(1.0);
    expect(rig.leftArm.rotation.x).toBeGreaterThan(1.0);
    expect(Math.abs(rig.rightArm.rotation.x - rig.leftArm.rotation.x)).toBeLessThan(0.35);
  });

  it('bow idle raises both arms to aim', () => {
    const rig = fakeRig();
    animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('bow'));
    expect(rig.rightArm.rotation.x).toBeGreaterThan(1.0);
    expect(rig.leftArm.rotation.x).toBeGreaterThan(1.0);
  });
});

describe('applyOverlays pants', () => {
  it('parents shinguards to each leg so they follow the walk cycle', () => {
    const rig = fakeRig();
    applyOverlays(rig, { pantsId: 'shinguards' });
    expect(rig.leftPantsSlot.children.length).toBe(1);
    expect(rig.rightPantsSlot.children.length).toBe(1);
    expect(rig.pantsSlot.children.length).toBe(0);
    const before = rig.leftPantsSlot.matrixWorld.clone();
    rig.leftLeg.rotation.x = 0.6;
    rig.root.updateMatrixWorld(true);
    expect(rig.leftPantsSlot.matrixWorld.equals(before)).toBe(false);
  });
});
