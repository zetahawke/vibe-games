import { describe, expect, it } from 'vitest';
import { createWaveState, tickWave, onFortBreached } from '../src/waves/waveLogic';
import { WAVE_DURATION_MS, REST_DURATION_MS } from '../src/config/gameConfig';

describe('waveLogic', () => {
  it('transitions wave to rest after 60s', () => {
    let s = createWaveState();
    s = tickWave(s, WAVE_DURATION_MS);
    expect(s.phase).toBe('rest');
    expect(s.phaseTimeLeftMs).toBe(REST_DURATION_MS);
  });

  it('rest then increments wave', () => {
    let s = createWaveState();
    s = tickWave(s, WAVE_DURATION_MS);
    s = tickWave(s, REST_DURATION_MS);
    expect(s.phase).toBe('wave');
    expect(s.wave).toBe(2);
  });

  it('breach loses life and goes to rest', () => {
    let s = createWaveState();
    s = onFortBreached(s);
    expect(s.lives).toBe(2);
    expect(s.phase).toBe('rest');
    expect(s.status).toBe('playing');
  });

  it('third breach is game over', () => {
    let s = createWaveState();
    s = onFortBreached(s);
    s = onFortBreached(s);
    s = onFortBreached(s);
    expect(s.lives).toBe(0);
    expect(s.status).toBe('gameover');
  });
});
