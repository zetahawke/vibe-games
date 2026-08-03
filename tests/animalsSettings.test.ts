import { beforeEach, describe, expect, it } from 'vitest';
import { getDropMode, setDropMode } from '@/domain/animals/settings';

beforeEach(() => localStorage.clear());

describe('animals settings', () => {
  it('defaults to guiado', () => {
    expect(getDropMode('ana')).toBe('guiado');
  });

  it('persists mode', () => {
    setDropMode('ana', 'suave');
    expect(getDropMode('ana')).toBe('suave');
  });
});
