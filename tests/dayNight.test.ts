import { describe, expect, it } from 'vitest';
import { isNightWave, nightSpeedMul } from '@/domain/waves/dayNight';

describe('dayNight cycle', () => {
  it('is day for three waves then night for two', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(isNightWave)).toEqual([
      false, false, false, true, true, false, false, false, true, true,
    ]);
  });

  it('speeds mobs 30% at night', () => {
    expect(nightSpeedMul(1)).toBe(1);
    expect(nightSpeedMul(4)).toBe(1.3);
  });
});
