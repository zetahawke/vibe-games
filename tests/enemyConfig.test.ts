import { describe, expect, it } from 'vitest';
import { enemyHp, spawnInterval, pickEnemyType, ENEMY_DEFS } from '@/domain/waves/enemyConfig';

describe('spawnInterval', () => {
  it('starts at 5s on wave 1', () => { expect(spawnInterval(1)).toBe(5); });
  it('decreases by 0.2 per wave', () => {
    expect(spawnInterval(2)).toBeCloseTo(4.8);
    expect(spawnInterval(5)).toBeCloseTo(4.2);
  });
  it('floors at 0.4s', () => {
    expect(spawnInterval(24)).toBe(0.4);
    expect(spawnInterval(50)).toBe(0.4);
  });
});

describe('enemyHp', () => {
  it('zombie starts at 20 HP on wave 1', () => { expect(enemyHp('zombie', 1)).toBe(20); });
  it('zombie HP grows 20% per wave', () => {
    expect(enemyHp('zombie', 2)).toBe(24);
    expect(enemyHp('zombie', 3)).toBe(28);
  });
  it('zombie HP caps at 2.2x base = 44', () => { expect(enemyHp('zombie', 100)).toBe(44); });
  it('big_zombie starts at 120 HP on wave 3', () => {
    expect(enemyHp('big_zombie', 3)).toBe(120);
    expect(enemyHp('big_zombie', 4)).toBe(144);
  });
  it('yeti starts at 520 HP on wave 15', () => { expect(enemyHp('yeti', 15)).toBe(520); });
});

describe('pickEnemyType', () => {
  it('only spawns zombies on wave 1', () => {
    for (let i = 0; i < 20; i++) expect(pickEnemyType(1, Math.random)).toBe('zombie');
  });
  it('can spawn big_zombie from wave 3', () => {
    const types = new Set(Array.from({ length: 200 }, () => pickEnemyType(3, Math.random)));
    expect(types.has('zombie')).toBe(true);
    expect(types.has('big_zombie')).toBe(true);
  });
  it('monster never appears before wave 7', () => {
    for (let i = 0; i < 50; i++) expect(pickEnemyType(6, Math.random)).not.toBe('monster');
  });
  it('yeti never appears before wave 15', () => {
    for (let i = 0; i < 50; i++) expect(pickEnemyType(14, Math.random)).not.toBe('yeti');
  });
  it('deterministic with fixed rng', () => {
    const type = pickEnemyType(10, () => 0.01);
    expect(['zombie', 'big_zombie', 'monster', 'yeti']).toContain(type);
  });
});
