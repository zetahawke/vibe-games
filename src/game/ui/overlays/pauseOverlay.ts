import { el } from '@/shared/dom';
import { fullscreenLabel, toggleFullscreen } from '@/shared/fullscreen';

export function renderPauseOverlay(
  parent: HTMLElement,
  onResume: () => void,
  onHub: () => void,
): HTMLElement {
  const overlay = el('div', { className: 'overlay' }, [
    el('div', { className: 'overlay-card' }, [
      el('h2', {}, ['Pausa']),
      el('div', { className: 'btn-col' }),
    ]),
  ]);
  const card = overlay.querySelector('.btn-col')!;
  const resume = el('button', { type: 'button', className: 'btn primary' }, ['Seguir']);
  const fullscreenBtn = el('button', {
    type: 'button',
    className: 'btn',
    id: 'pause-fullscreen-btn',
  }, [fullscreenLabel()]) as HTMLButtonElement;
  const hub = el('button', { type: 'button', className: 'btn' }, ['Ir al hub']);

  const onFsChange = () => {
    fullscreenBtn.textContent = fullscreenLabel();
  };
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  const cleanup = () => {
    document.removeEventListener('fullscreenchange', onFsChange);
    document.removeEventListener('webkitfullscreenchange', onFsChange);
  };

  resume.addEventListener('click', () => {
    cleanup();
    onResume();
  });
  fullscreenBtn.addEventListener('click', () => {
    void toggleFullscreen().then(() => {
      fullscreenBtn.textContent = fullscreenLabel();
    });
  });
  hub.addEventListener('click', () => {
    cleanup();
    onHub();
  });

  card.append(resume, fullscreenBtn, hub);
  parent.append(overlay);
  return overlay;
}
