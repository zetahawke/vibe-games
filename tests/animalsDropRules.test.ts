import { describe, expect, it } from 'vitest';
import { resolveDrop } from '@/domain/animals/dropRules';

describe('resolveDrop', () => {
  it('accepts matching shadow in all modes', () => {
    for (const mode of ['libre', 'suave', 'guiado'] as const) {
      expect(resolveDrop(mode, 'perro', 'perro')).toEqual({
        accept: true,
        feedback: 'success',
      });
    }
  });

  it('rejects miss; softFail only in suave', () => {
    expect(resolveDrop('libre', 'perro', null)).toEqual({ accept: false, feedback: 'none' });
    expect(resolveDrop('suave', 'perro', null)).toEqual({ accept: false, feedback: 'softFail' });
    expect(resolveDrop('guiado', 'perro', null)).toEqual({ accept: false, feedback: 'none' });
  });

  it('guiado rejects wrong shadow without softFail', () => {
    expect(resolveDrop('guiado', 'perro', 'gato')).toEqual({ accept: false, feedback: 'none' });
  });

  it('suave softFails on wrong shadow', () => {
    expect(resolveDrop('suave', 'perro', 'gato')).toEqual({ accept: false, feedback: 'softFail' });
  });

  it('libre rejects wrong shadow silently', () => {
    expect(resolveDrop('libre', 'perro', 'gato')).toEqual({ accept: false, feedback: 'none' });
  });
});
