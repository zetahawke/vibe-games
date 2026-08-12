import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  fullscreenLabel,
  isFullscreen,
  toggleFullscreen,
} from '@/shared/fullscreen';

describe('fullscreen helpers', () => {
  const originalFs = document.fullscreenElement;

  afterEach(() => {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => originalFs,
    });
    vi.restoreAllMocks();
  });

  it('isFullscreen follows document.fullscreenElement', () => {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => null,
    });
    expect(isFullscreen()).toBe(false);
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    });
    expect(isFullscreen()).toBe(true);
  });

  it('fullscreenLabel reflects current state', () => {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => null,
    });
    expect(fullscreenLabel()).toBe('Pantalla completa');
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    });
    expect(fullscreenLabel()).toBe('Salir de pantalla completa');
  });

  it('toggleFullscreen requests or exits fullscreen on documentElement', async () => {
    const request = vi.fn().mockResolvedValue(undefined);
    const exit = vi.fn().mockResolvedValue(undefined);
    document.documentElement.requestFullscreen = request;
    document.exitFullscreen = exit;

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => null,
    });
    await toggleFullscreen();
    expect(request).toHaveBeenCalledOnce();
    expect(exit).not.toHaveBeenCalled();

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    });
    await toggleFullscreen();
    expect(exit).toHaveBeenCalledOnce();
  });
});
