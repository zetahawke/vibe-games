import { describe, expect, it } from 'vitest';
import { shouldTickWhileHidden, splitSimulationDt } from '@/domain/online/backgroundTick';

describe('shouldTickWhileHidden', () => {
  it('only keeps simulating for the online host', () => {
    expect(shouldTickWhileHidden(true)).toBe(true);
    expect(shouldTickWhileHidden(false)).toBe(false);
  });
});

describe('splitSimulationDt', () => {
  it('matches the visible-tab cap of 50ms', () => {
    expect(splitSimulationDt(16, { background: false })).toEqual([0.016]);
    expect(splitSimulationDt(200, { background: false })).toEqual([0.05]);
  });

  it('catches up a throttled background second in 50ms steps', () => {
    const steps = splitSimulationDt(1000, { background: true });
    expect(steps).toHaveLength(20);
    expect(steps.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
  });
});
