import { beforeEach, describe, expect, it } from 'vitest';
import { getIdentifySettings, setIdentifySettings } from '@/domain/identify/settings';

beforeEach(() => localStorage.clear());

describe('identify settings', () => {
  it('defaults to guiado and vocales', () => {
    expect(getIdentifySettings('ana')).toEqual({
      dropMode: 'guiado',
      theme: 'vocales',
    });
  });

  it('persists settings', () => {
    setIdentifySettings('ana', { dropMode: 'suave', theme: 'numeros' });
    expect(getIdentifySettings('ana')).toEqual({
      dropMode: 'suave',
      theme: 'numeros',
    });
  });
});
