import { describe, expect, it } from 'vitest';
import { applyLookGain } from '@/game/input/lookGain';

describe('applyLookGain', () => {
  it('lowers mouse look by 20% and raises touch look by 30%', () => {
    expect(applyLookGain(10, 20, 'mouse')).toEqual({ dx: 8, dy: 16 });
    expect(applyLookGain(10, 20, 'touch')).toEqual({ dx: 13, dy: 26 });
  });
});
