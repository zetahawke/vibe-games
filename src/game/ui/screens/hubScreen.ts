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
import { gradeLabel, loadProfile } from '@/domain/profile/profile';
import { getHighScore, loadSave } from '@/domain/save/save';
import { renderAnimalsSettingsOverlay } from '@/game/ui/overlays/animalsSettingsOverlay';
import { renderIdentifySettingsOverlay } from '@/game/ui/overlays/identifySettingsOverlay';
import { clear, el } from '@/shared/dom';
import { renderLobbyScreen } from './lobbyScreen';
import { renderLeaderboardScreen } from './leaderboardScreen';
import { renderProfileScreen } from './profileScreen';

export function renderHubScreen(
  root: HTMLElement,
  username: string,
  onPlayShooter: (mode: 'new' | 'continue') => void,
  onPlayAnimals: (dropMode: DropMode, graphicsStyle: GraphicsStyle) => void,
  onPlayIdentify: (theme: IdentifyTheme, dropMode: DropMode) => void,
  onLogout: () => void,
  onPlayOnline?: (
    sessionId: string,
    code: string,
    playerId: string,
    sessionToken: string,
    playerCount: number,
    isHost: boolean,
  ) => void,
): void {
  const profile = loadProfile(username);
  if (!profile) {
    renderProfileScreen(root, username, () => {
      renderHubScreen(root, username, onPlayShooter, onPlayAnimals, onPlayIdentify, onLogout, onPlayOnline);
    }, { required: true });
    return;
  }

  clear(root);
  const animalsSettings = getAnimalsSettings(username);
  const identifySettings = getIdentifySettings(username);

  const profileBtn = el('button', { type: 'button', className: 'btn ghost' }, ['Mi perfil']);
  profileBtn.addEventListener('click', () => {
    renderProfileScreen(root, username, () => {
      renderHubScreen(root, username, onPlayShooter, onPlayAnimals, onPlayIdentify, onLogout, onPlayOnline);
    });
  });

  const logoutBtn = el('button', { type: 'button', className: 'btn ghost' }, ['Cerrar sesión']);
  logoutBtn.addEventListener('click', () => {
    logout();
    onLogout();
  });

  const fuerteBtn = el('button', { type: 'button', className: 'btn primary' }, ['Entrar']);
  fuerteBtn.addEventListener('click', () => {
    renderFuerteMenu(root, username, onPlayShooter, onPlayAnimals, onPlayIdentify, onLogout, onPlayOnline);
  });

  const animalsPlay = el('button', { type: 'button', className: 'btn primary' }, ['Jugar']) as HTMLButtonElement;
  animalsPlay.addEventListener('click', () => {
    renderAnimalsSettingsOverlay(root, username, onPlayAnimals, () => undefined);
  });

  const identifyPlay = el('button', { type: 'button', className: 'btn primary' }, ['Jugar']) as HTMLButtonElement;
  identifyPlay.addEventListener('click', () => {
    renderIdentifySettingsOverlay(root, username, onPlayIdentify, () => undefined);
  });

  root.append(
    el('section', { className: 'screen hub-screen' }, [
      el('header', { className: 'hub-header' }, [
        el('div', { className: 'hub-intro' }, [
          el('h1', {}, ['Juegos de Casa']),
          el('p', { className: 'muted' }, [`Hola, ${username} · ${gradeLabel(profile.grade)}`]),
        ]),
        el('div', { className: 'hub-actions' }, [profileBtn, logoutBtn]),
      ]),
      el('div', { className: 'game-grid' }, [
        makeCard(
          'Protege el fuerte',
          'Defiende el fuerte. Matemáticas de 2do básico.',
          'Edad recomendada: 7+',
          el('div', { className: 'card-actions' }, [fuerteBtn]),
          '/hub/fuerte.jpg',
        ),
        makeCard(
          'Animales',
          'Arrastra animales a su sombra.',
          `Edad 2+ · ${labelMode(animalsSettings.dropMode)} · ${labelGraphics(animalsSettings.graphicsStyle)}`,
          el('div', { className: 'card-actions' }, [animalsPlay]),
          '/hub/animales.jpg',
        ),
        makeCard(
          'Identificar',
          'Vocales, números y abecedario con voz.',
          `Edad 2+ · ${themeTitle(identifySettings.theme)} · ${labelMode(identifySettings.dropMode)}`,
          el('div', { className: 'card-actions' }, [identifyPlay]),
          '/hub/identificar.jpg',
        ),
      ]),
    ]),
  );
}

function renderFuerteMenu(
  root: HTMLElement,
  username: string,
  onPlayShooter: (mode: 'new' | 'continue') => void,
  onPlayAnimals: (dropMode: DropMode, graphicsStyle: GraphicsStyle) => void,
  onPlayIdentify: (theme: IdentifyTheme, dropMode: DropMode) => void,
  onLogout: () => void,
  onPlayOnline?: (
    sessionId: string,
    code: string,
    playerId: string,
    sessionToken: string,
    playerCount: number,
    isHost: boolean,
  ) => void,
): void {
  if (!loadProfile(username)) {
    renderProfileScreen(root, username, () => {
      renderFuerteMenu(root, username, onPlayShooter, onPlayAnimals, onPlayIdentify, onLogout, onPlayOnline);
    }, { required: true });
    return;
  }

  clear(root);
  const save = loadSave(username);
  const highScore = getHighScore(username);

  const backToHub = () =>
    renderHubScreen(root, username, onPlayShooter, onPlayAnimals, onPlayIdentify, onLogout, onPlayOnline);

  const continueBtn = el('button', {
    type: 'button',
    className: 'btn primary',
    ...(save ? {} : { disabled: 'true' }),
  }, ['Continuar']) as HTMLButtonElement;
  continueBtn.addEventListener('click', () => {
    if (save) onPlayShooter('continue');
  });

  const newBtn = el('button', { type: 'button', className: 'btn primary' }, ['Nueva partida']);
  newBtn.addEventListener('click', () => onPlayShooter('new'));

  const actions = el('div', { className: 'btn-col' }, [newBtn]);
  if (save) actions.prepend(continueBtn);

  if (onPlayOnline) {
    const onlineBtn = el('button', { type: 'button', className: 'btn' }, ['En línea']);
    onlineBtn.addEventListener('click', () =>
      renderLobbyScreen(
        root,
        username,
        (sessionId, code, playerId, sessionToken, playerCount, isHost) => {
          onPlayOnline(sessionId, code, playerId, sessionToken, playerCount, isHost);
        },
        () => renderFuerteMenu(root, username, onPlayShooter, onPlayAnimals, onPlayIdentify, onLogout, onPlayOnline),
      ),
    );
    actions.append(onlineBtn);
  }

  const lbBtn = el('button', { type: 'button', className: 'btn ghost' }, ['Clasificación']);
  lbBtn.addEventListener('click', () =>
    void renderLeaderboardScreen(root, () =>
      renderFuerteMenu(root, username, onPlayShooter, onPlayAnimals, onPlayIdentify, onLogout, onPlayOnline),
    ),
  );
  actions.append(lbBtn);

  const backBtn = el('button', { type: 'button', className: 'btn ghost' }, ['← Volver']);
  backBtn.addEventListener('click', backToHub);
  actions.append(backBtn);

  root.append(
    el('section', { className: 'screen hub-screen fuerte-menu' }, [
      el('h1', {}, ['Protege el fuerte']),
      el('p', { className: 'muted' }, [
        highScore > 0 ? `Mejor puntuación: ${highScore}` : 'Aún no hay récord local.',
      ]),
      actions,
    ]),
  );
}

function makeCard(
  title: string,
  description: string,
  meta: string | null,
  actions: HTMLElement,
  bgUrl: string,
): HTMLElement {
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
}

function labelMode(mode: DropMode): string {
  if (mode === 'free') return 'Libre';
  if (mode === 'smooth') return 'Suave';
  return 'Guiado';
}

function labelGraphics(style: GraphicsStyle): string {
  return style === 'realistic' ? 'Realista' : 'Dibujado';
}
