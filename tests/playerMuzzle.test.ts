import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getWeapon } from '@/domain/weapons/weapons';
import {
  animatePlayer,
  getMuzzleWorldPosition,
  syncWeaponModel,
  type PlayerRig,
} from '@/game/world/player';
import '@/assets/boxing';

function fakeRig(): PlayerRig {
  const root = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  rightArm.position.set(0.55, 1.7, 0);
  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.8, 0);
  rightArm.add(rightHand);
  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.8, 0);
  leftArm.add(leftHand);
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  const hatSlot = new THREE.Group();
  const shirtSlot = new THREE.Group();
  const pantsSlot = new THREE.Group();
  root.add(leftArm, rightArm, leftLeg, rightLeg, hatSlot, shirtSlot, pantsSlot);
  return {
    root, leftArm, rightArm, leftLeg, rightLeg,
    rightHand, leftHand, weaponSlot: rightHand,
    hatSlot, shirtSlot, pantsSlot,
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

describe('animatePlayer grips', () => {
  it('paired idle keeps left arm near shield tuck', () => {
    const rig = fakeRig();
    animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('sword_shield'));
    expect(rig.leftArm.rotation.x).toBeLessThan(0.05);
    expect(Math.abs(rig.leftArm.rotation.z)).toBeGreaterThan(0.1);
  });

  it('bow idle raises both arms to aim', () => {
    const rig = fakeRig();
    animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('bow'));
    expect(rig.rightArm.rotation.x).toBeGreaterThan(1.0);
    expect(rig.leftArm.rotation.x).toBeGreaterThan(1.0);
  });
});
