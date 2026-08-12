import { describe, expect, it, vi } from 'vitest';
import { renderPauseOverlay } from '@/game/ui/overlays/pauseOverlay';

describe('renderPauseOverlay', () => {
  it('includes a fullscreen toggle button between resume and hub', () => {
    const parent = document.createElement('div');
    const overlay = renderPauseOverlay(parent, vi.fn(), vi.fn());
    const btn = overlay.querySelector('#pause-fullscreen-btn') as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    expect(btn!.textContent).toBe('Pantalla completa');
    const buttons = [...overlay.querySelectorAll('.btn-col .btn')].map((b) => b.textContent);
    expect(buttons).toEqual(['Seguir', 'Pantalla completa', 'Ir al hub']);
  });
});
