import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getWeapon } from '@/domain/weapons/weapons';
import {
  animatePlayer,
  getMuzzleWorldPosition,
  type PlayerRig,
} from '@/game/world/player';

function fakeRig(): PlayerRig {
  const root = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  rightArm.position.set(0.55, 1.7, 0);
  const weaponSlot = new THREE.Group();
  weaponSlot.position.set(0, -0.8, 0);
  rightArm.add(weaponSlot);
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  root.add(leftArm, rightArm, leftLeg, rightLeg);
  return { root, leftArm, rightArm, leftLeg, rightLeg, weaponSlot };
}

describe('getMuzzleWorldPosition', () => {
  it('sits near chest height when the pistol is raised', () => {
    const rig = fakeRig();
    animatePlayer(rig, 0, 0, false, true, 0.016, getWeapon('pistol'));
    const muzzle = getMuzzleWorldPosition(rig);
    expect(muzzle.y).toBeGreaterThan(1.35);
    expect(muzzle.y).toBeLessThan(2.15);
  });
});
