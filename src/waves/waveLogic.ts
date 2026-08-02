import {
  MAX_LIVES,
  REST_DURATION_MS,
  WAVE_DURATION_MS,
} from '../config/gameConfig';
import { Phase } from '../save/save';

export interface WaveState {
  wave: number;
  phase: Phase;
  phaseTimeLeftMs: number;
  lives: number;
  status: 'playing' | 'gameover';
}

export function createWaveState(): WaveState {
  return {
    wave: 1,
    phase: 'wave',
    phaseTimeLeftMs: WAVE_DURATION_MS,
    lives: MAX_LIVES,
    status: 'playing',
  };
}

export function zombiesToSpawnForWave(wave: number): number {
  return 4 + Math.max(1, wave);
}

export function tickWave(state: WaveState, dtMs: number): WaveState {
  if (state.status !== 'playing') return state;

  let phaseTimeLeftMs = state.phaseTimeLeftMs - dtMs;
  let { phase, wave } = state;

  while (phaseTimeLeftMs <= 0) {
    if (phase === 'wave') {
      phase = 'rest';
      phaseTimeLeftMs += REST_DURATION_MS;
    } else {
      phase = 'wave';
      wave += 1;
      phaseTimeLeftMs += WAVE_DURATION_MS;
    }
  }

  return { ...state, phase, wave, phaseTimeLeftMs };
}

export function onFortBreached(state: WaveState): WaveState {
  if (state.status !== 'playing') return state;

  const lives = state.lives - 1;
  if (lives <= 0) {
    return {
      ...state,
      lives: 0,
      status: 'gameover',
    };
  }

  return {
    ...state,
    lives,
    phase: 'rest',
    phaseTimeLeftMs: REST_DURATION_MS,
  };
}
