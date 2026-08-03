import { beforeEach, describe, expect, it } from 'vitest';
import {
  getAnimalsSettings,
  getDropMode,
  getGraphicsStyle,
  setAnimalsSettings,
  setDropMode,
  setGraphicsStyle,
} from '@/domain/animals/settings';

beforeEach(() => localStorage.clear());

describe('animals settings', () => {
  it('defaults to guiado and dibujado', () => {
    expect(getDropMode('ana')).toBe('guiado');
    expect(getGraphicsStyle('ana')).toBe('dibujado');
  });

  it('persists drop mode without wiping graphics', () => {
    setGraphicsStyle('ana', 'realista');
    setDropMode('ana', 'suave');
    expect(getAnimalsSettings('ana')).toEqual({
      dropMode: 'suave',
      graphicsStyle: 'realista',
    });
  });

  it('persists graphics style', () => {
    setAnimalsSettings('ana', { dropMode: 'libre', graphicsStyle: 'realista' });
    expect(getGraphicsStyle('ana')).toBe('realista');
    expect(getDropMode('ana')).toBe('libre');
  });
});
