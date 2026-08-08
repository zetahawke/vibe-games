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
  it('defaults to guided and drawn', () => {
    expect(getDropMode('ana')).toBe('guided');
    expect(getGraphicsStyle('ana')).toBe('drawn');
  });

  it('persists drop mode without wiping graphics', () => {
    setGraphicsStyle('ana', 'realistic');
    setDropMode('ana', 'smooth');
    expect(getAnimalsSettings('ana')).toEqual({
      dropMode: 'smooth',
      graphicsStyle: 'realistic',
    });
  });

  it('persists graphics style', () => {
    setAnimalsSettings('ana', { dropMode: 'free', graphicsStyle: 'realistic' });
    expect(getGraphicsStyle('ana')).toBe('realistic');
    expect(getDropMode('ana')).toBe('free');
  });
});
