import { el } from './dom';

export function renderGameOverOverlay(
  parent: HTMLElement,
  wave: number,
  highScore: number,
  onHub: () => void,
  score = 0,
): HTMLElement {
  const overlay = el('div', { className: 'overlay' }, [
    el('div', { className: 'overlay-card' }, [
      el('h2', {}, ['¡Game Over!']),
      el('p', {}, [`Llegaste a la oleada ${wave}`]),
      el('p', {}, [`Puntos: ${score}`]),
      el('p', {}, [`Mejor puntuación: ${highScore}`]),
      el('p', {}, ['Tu partida se borró. ¡Inténtalo de nuevo!']),
    ]),
  ]);
  const btn = el('button', { type: 'button', className: 'btn primary' }, ['Volver al hub']);
  btn.addEventListener('click', onHub);
  overlay.querySelector('.overlay-card')!.append(btn);
  parent.append(overlay);
  return overlay;
}
