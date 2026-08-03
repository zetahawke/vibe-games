import { logout } from '@/domain/auth/auth';
import {
  getAnimalsSettings,
  type DropMode,
  type GraphicsStyle,
} from '@/domain/animals';
import {
  getIdentifySettings,
  themeTitle,
  type IdentifyTheme,
} from '@/domain/identify';
import { getHighScore, loadSave } from '@/domain/save/save';
import { renderAnimalsSettingsOverlay } from '@/game/ui/overlays/animalsSettingsOverlay';
import { renderIdentifySettingsOverlay } from '@/game/ui/overlays/identifySettingsOverlay';
import { clear, el } from '@/shared/dom';

export function renderHubScreen(
  root: HTMLElement,
  username: string,
  onPlayShooter: (mode: 'new' | 'continue') => void,
  onPlayAnimals: (dropMode: DropMode, graphicsStyle: GraphicsStyle) => void,
  onPlayIdentify: (theme: IdentifyTheme, dropMode: DropMode) => void,
  onLogout: () => void,
): void {
  clear(root);
  const save = loadSave(username);
  const highScore = getHighScore(username);
  const animalsSettings = getAnimalsSettings(username);
  const identifySettings = getIdentifySettings(username);

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
    renderAnimalsSettingsOverlay(root, username, onPlayAnimals, () => undefined);
  });

  const identifyPlay = el('button', { type: 'button', className: 'btn primary' }, [
    'Jugar',
  ]) as HTMLButtonElement;
  identifyPlay.addEventListener('click', () => {
    renderIdentifySettingsOverlay(root, username, onPlayIdentify, () => undefined);
  });

  const makeCard = (
    title: string,
    description: string,
    meta: string | null,
    actions: HTMLElement,
    bgUrl: string,
  ): HTMLElement => {
    const card = el('article', { className: 'game-card' });
    const bg = el('div', {
      className: 'game-card-bg',
      style: `background-image: url('${bgUrl}')`,
      'aria-hidden': 'true',
    });
    const body = el('div', { className: 'game-card-body' }, [
      el('h2', {}, [title]),
      el('p', {}, [description]),
    ]);
    if (meta) body.append(el('p', { className: 'muted' }, [meta]));
    body.append(actions);
    card.append(bg, body);
    return card;
  };

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
        makeCard(
          'Fuerte de Mates',
          'Defiende el fuerte y gana monedas con matemáticas.',
          'Edad recomendada: 5+',
          shooterActions,
          '/hub/fuerte.jpg',
        ),
        makeCard(
          'Animales',
          'Arrastra animales a su sombra.',
          `Edad recomendada: 2+ · Modo: ${labelMode(animalsSettings.dropMode)} · Gráficos: ${labelGraphics(animalsSettings.graphicsStyle)}`,
          el('div', { className: 'card-actions' }, [animalsPlay]),
          '/hub/animales.jpg',
        ),
        makeCard(
          'Identificar',
          'Vocales, números y abecedario con voz.',
          `Edad recomendada: 2+ · Tema: ${themeTitle(identifySettings.theme)} · Modo: ${labelMode(identifySettings.dropMode)}`,
          el('div', { className: 'card-actions' }, [identifyPlay]),
          '/hub/identificar.jpg',
        ),
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
