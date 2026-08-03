import { afterEach, describe, expect, it, vi } from 'vitest';
import { isTouchPrimary } from '@/shared/device';

describe('isTouchPrimary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false for fine pointer with hover (PC)', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('hover: hover') || query.includes('pointer: fine'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }));
    vi.stubGlobal('navigator', { maxTouchPoints: 0 });
    expect(isTouchPrimary()).toBe(false);
  });

  it('returns true for coarse pointer', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('pointer: coarse'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }));
    vi.stubGlobal('navigator', { maxTouchPoints: 5 });
    expect(isTouchPrimary()).toBe(true);
  });
});

