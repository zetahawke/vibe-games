import { el } from '@/shared/dom';

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
  const hub = el('button', { type: 'button', className: 'btn' }, ['Ir al hub']);
  resume.addEventListener('click', onResume);
  hub.addEventListener('click', onHub);
  card.append(resume, hub);
  parent.append(overlay);
  return overlay;
}
