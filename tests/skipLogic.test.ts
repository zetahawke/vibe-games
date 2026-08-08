import { describe, expect, it } from 'vitest';
import { shouldAwardSkipCoin, canSkipWave, SKIP_COINS_MAX } from '@/domain/rewards/skipLogic';

describe('shouldAwardSkipCoin', () => {
  it('awards on every 10th wave', () => {
    expect(shouldAwardSkipCoin(10)).toBe(true);
    expect(shouldAwardSkipCoin(20)).toBe(true);
    expect(shouldAwardSkipCoin(30)).toBe(true);
  });
  it('does not award on non-multiples of 10', () => {
    expect(shouldAwardSkipCoin(0)).toBe(false);
    expect(shouldAwardSkipCoin(5)).toBe(false);
    expect(shouldAwardSkipCoin(11)).toBe(false);
  });
});

describe('canSkipWave', () => {
  it('true when skipCoins > 0', () => {
    expect(canSkipWave(1)).toBe(true);
    expect(canSkipWave(2)).toBe(true);
  });
  it('false when no skip coins', () => {
    expect(canSkipWave(0)).toBe(false);
  });
});

describe('SKIP_COINS_MAX', () => {
  it('is 2', () => {
    expect(SKIP_COINS_MAX).toBe(2);
  });
});
