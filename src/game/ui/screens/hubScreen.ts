import { logout } from '@/domain/auth/auth';
import {
  getAnimalsSettings,
  type DropMode,
  type GraphicsStyle,
} from '@/domain/animals';
import { getHighScore, loadSave } from '@/domain/save/save';
import { renderAnimalsSettingsOverlay } from '@/game/ui/overlays/animalsSettingsOverlay';
import { clear, el } from '@/shared/dom';

export function renderHubScreen(
  root: HTMLElement,
  username: string,
  onPlayShooter: (mode: 'new' | 'continue') => void,
  onPlayAnimals: (dropMode: DropMode, graphicsStyle: GraphicsStyle) => void,
  onLogout: () => void,
): void {
  clear(root);
  const save = loadSave(username);
  const highScore = getHighScore(username);
  const animalsSettings = getAnimalsSettings(username);

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
    if (save) onPlayShooter('continue');
  });
  newBtn.addEventListener('click', () => onPlayShooter('new'));
  logoutBtn.addEventListener('click', () => {
    logout();
    onLogout();
  });

  const shooterActions = el('div', { className: 'card-actions' }, [newBtn]);
  if (save) shooterActions.prepend(continueBtn);

  const animalsPlay = el('button', { type: 'button', className: 'btn primary' }, [
    'Jugar',
  ]) as HTMLButtonElement;
  animalsPlay.addEventListener('click', () => {
    renderAnimalsSettingsOverlay(
      root,
      username,
      (dropMode, graphicsStyle) => onPlayAnimals(dropMode, graphicsStyle),
      () => {
        /* stay on hub */
      },
    );
  });

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
        el('article', { className: 'game-card' }, [
          el('h2', {}, ['Animales']),
          el('p', {}, ['Arrastra animales a su sombra.']),
          el('p', { className: 'muted' }, [
            `Modo: ${labelMode(animalsSettings.dropMode)} · Gráficos: ${labelGraphics(animalsSettings.graphicsStyle)}`,
          ]),
          el('div', { className: 'card-actions' }, [animalsPlay]),
        ]),
      ]),
    ]),
  );
}

function labelMode(mode: DropMode): string {
  if (mode === 'libre') return 'Libre';
  if (mode === 'suave') return 'Suave';
  return 'Guiado';
}

function labelGraphics(style: GraphicsStyle): string {
  return style === 'realista' ? 'Realista' : 'Dibujado';
}
