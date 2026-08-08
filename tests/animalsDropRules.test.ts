import { describe, expect, it } from 'vitest';
import { resolveDrop } from '@/domain/animals/dropRules';

describe('resolveDrop', () => {
  it('accepts matching shadow in all modes', () => {
    for (const mode of ['free', 'smooth', 'guided'] as const) {
      expect(resolveDrop(mode, 'perro', 'perro')).toEqual({
        accept: true,
        feedback: 'success',
      });
    }
  });

  it('rejects miss; softFail only in smooth', () => {
    expect(resolveDrop('free',   'perro', null)).toEqual({ accept: false, feedback: 'none' });
    expect(resolveDrop('smooth', 'perro', null)).toEqual({ accept: false, feedback: 'softFail' });
    expect(resolveDrop('guided', 'perro', null)).toEqual({ accept: false, feedback: 'none' });
  });

  it('guided rejects wrong shadow without softFail', () => {
    expect(resolveDrop('guided', 'perro', 'gato')).toEqual({ accept: false, feedback: 'none' });
  });

  it('smooth softFails on wrong shadow', () => {
    expect(resolveDrop('smooth', 'perro', 'gato')).toEqual({ accept: false, feedback: 'softFail' });
  });

  it('free rejects wrong shadow silently', () => {
    expect(resolveDrop('free', 'perro', 'gato')).toEqual({ accept: false, feedback: 'none' });
  });
});
