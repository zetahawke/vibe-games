import { describe, expect, it } from 'vitest';
import { quizCoinMultiplier, quizCoinsForWave, shouldHealOnWave, streakBonusCoins } from '@/domain/rewards/rewardLogic';

describe('quizCoinMultiplier', () => {
  it('is 1.0 on wave 1', () => { expect(quizCoinMultiplier(1)).toBeCloseTo(1.0); });
  it('increases by 10% per wave', () => {
    expect(quizCoinMultiplier(2)).toBeCloseTo(1.1);
    expect(quizCoinMultiplier(5)).toBeCloseTo(1.4);
    expect(quizCoinMultiplier(10)).toBeCloseTo(1.9);
  });
  it('is never below 1.0', () => { expect(quizCoinMultiplier(0)).toBeGreaterThanOrEqual(1.0); });
});

describe('quizCoinsForWave', () => {
  it('returns base coins on wave 1', () => { expect(quizCoinsForWave(10, 1)).toBe(10); });
  it('scales with wave', () => {
    expect(quizCoinsForWave(10, 2)).toBe(11);
    expect(quizCoinsForWave(10, 5)).toBe(14);
  });
  it('rounds to nearest integer', () => { expect(Number.isInteger(quizCoinsForWave(7, 3))).toBe(true); });
});

describe('shouldHealOnWave', () => {
  it('heals on multiples of 5', () => {
    expect(shouldHealOnWave(5)).toBe(true);
    expect(shouldHealOnWave(10)).toBe(true);
    expect(shouldHealOnWave(15)).toBe(true);
  });
  it('does not heal on non-multiples', () => {
    expect(shouldHealOnWave(1)).toBe(false);
    expect(shouldHealOnWave(4)).toBe(false);
    expect(shouldHealOnWave(6)).toBe(false);
  });
  it('does not heal on wave 0', () => { expect(shouldHealOnWave(0)).toBe(false); });
});

describe('streakBonusCoins', () => {
  it('gives 20% on every 5th answer', () => {
    expect(streakBonusCoins(100, 5)).toBe(20);
    expect(streakBonusCoins(100, 10)).toBe(20);
    expect(streakBonusCoins(50, 5)).toBe(10);
  });
  it('gives 0 when not a multiple of 5', () => {
    expect(streakBonusCoins(100, 1)).toBe(0);
    expect(streakBonusCoins(100, 4)).toBe(0);
    expect(streakBonusCoins(100, 6)).toBe(0);
  });
  it('gives 0 when streak is 0', () => { expect(streakBonusCoins(100, 0)).toBe(0); });
  it('floors the 20%', () => { expect(streakBonusCoins(7, 5)).toBe(1); });
});
