import { beforeEach, describe, expect, it } from 'vitest';
import { getIdentifySettings, setIdentifySettings } from '@/domain/identify/settings';

beforeEach(() => localStorage.clear());

describe('identify settings', () => {
  it('defaults to guided and vowels', () => {
    expect(getIdentifySettings('ana')).toEqual({
      dropMode: 'guided',
      theme: 'vowels',
    });
  });

  it('persists settings', () => {
    setIdentifySettings('ana', { dropMode: 'smooth', theme: 'numbers' });
    expect(getIdentifySettings('ana')).toEqual({
      dropMode: 'smooth',
      theme: 'numbers',
    });
  });
});
