import { logout } from '@/domain/auth/auth';
import { getHighScore, loadSave } from '@/domain/save/save';
import { clear, el } from '@/shared/dom';

export function renderHubScreen(
  root: HTMLElement,
  username: string,
  onPlay: (mode: 'new' | 'continue') => void,
  onLogout: () => void,
): void {
  clear(root);
  const save = loadSave(username);
  const highScore = getHighScore(username);

  const continueBtn = el(
    'button',
    {
      type: 'button',
      className: 'btn primary',
      ...(save ? {} : { disabled: 'true' }),
    },
    ['Continuar'],
  );
  const newBtn = el('button', { type: 'button', className: 'btn primary' }, ['Nueva partida']);
  const logoutBtn = el('button', { type: 'button', className: 'btn ghost' }, ['Cerrar sesión']);

  continueBtn.addEventListener('click', () => {
    if (save) onPlay('continue');
  });
  newBtn.addEventListener('click', () => onPlay('new'));
  logoutBtn.addEventListener('click', () => {
    logout();
    onLogout();
  });

  const shooterActions = el('div', { className: 'card-actions' }, [newBtn]);
  if (save) shooterActions.prepend(continueBtn);

  root.append(
    el('section', { className: 'screen hub-screen' }, [
      el('header', { className: 'hub-header' }, [
        el('h1', {}, ['Juegos de Casa']),
        el('p', {}, [`Hola, ${username}`]),
        highScore > 0
          ? el('p', { className: 'hiscore' }, [`Mejor puntuación: ${highScore}`])
          : el('p', { className: 'hiscore muted' }, ['Aún no hay récord']),
        logoutBtn,
      ]),
      el('div', { className: 'game-grid' }, [
        el('article', { className: 'game-card' }, [
          el('h2', {}, ['Fuerte de Mates']),
          el('p', {}, ['Defiende el fuerte y gana monedas con matemáticas.']),
          shooterActions,
        ]),
        el('article', { className: 'game-card locked' }, [
          el('h2', {}, ['Animales']),
          el('p', {}, ['Arrastra animales a su sombra.']),
          el('div', { className: 'coming-soon' }, ['Próximamente']),
        ]),
      ]),
    ]),
  );
}
