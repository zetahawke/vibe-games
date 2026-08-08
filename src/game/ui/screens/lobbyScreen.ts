import { el, clear } from '@/shared/dom';
import { createSession, joinSession } from '@/domain/online/sessionService';
import { resolveIdentity, type PlayerIdentity } from '@/domain/online/playerService';

export function renderLobbyScreen(
  root: HTMLElement,
  username: string,
  onStart: (
    sessionId: string,
    code: string,
    playerId: string,
    sessionToken: string,
    playerCount: number,
    isHost: boolean,
  ) => void,
  onCancel: () => void,
): void {
  showMain(root, username, null, onStart, onCancel);
}

function showMain(
  root: HTMLElement,
  username: string,
  preloadedIdentity: PlayerIdentity | null,
  onStart: Parameters<typeof renderLobbyScreen>[2],
  onCancel: () => void,
): void {
  clear(root);
  const section = el('section', { className: 'screen' });

  const createBtn = el('button', { type: 'button', className: 'btn primary', disabled: 'true' }, ['➕ Crear sala']) as HTMLButtonElement;
  const joinBtn   = el('button', { type: 'button', className: 'btn',         disabled: 'true' }, ['🔗 Unirse a sala']) as HTMLButtonElement;
  const cancelBtn = el('button', { type: 'button', className: 'btn ghost' }, ['← Volver']) as HTMLButtonElement;
  const msg = el('p', { className: 'muted' }, ['Verificando identidad…']);

  section.append(el('h1', {}, ['Juego en línea']));
  section.append(el('div', { className: 'btn-col' }, [createBtn, joinBtn, cancelBtn]), msg);
  root.append(section);

  let cachedIdentity: PlayerIdentity | null = preloadedIdentity;

  const activate = (identity: PlayerIdentity) => {
    cachedIdentity = identity;
    msg.textContent = `✅ Conectado como ${identity.username}`;
    createBtn.disabled = false;
    joinBtn.disabled = false;
  };

  if (preloadedIdentity) {
    activate(preloadedIdentity);
  } else {
    void resolveIdentity(username).then((result) => {
      if ('error' in result) {
        msg.className = 'error';
        msg.textContent = result.error;
      } else {
        activate(result);
      }
    });
  }

  createBtn.addEventListener('click', async () => {
    if (!cachedIdentity) return;
    createBtn.disabled = true;
    joinBtn.disabled = true;
    msg.textContent = 'Creando sala…';
    const result = await createSession(cachedIdentity.playerId, cachedIdentity.sessionToken);
    if ('error' in result) {
      msg.className = 'error';
      msg.textContent = result.error;
      createBtn.disabled = false;
      joinBtn.disabled = false;
      return;
    }
    onStart(result.sessionId, result.code, cachedIdentity.playerId, cachedIdentity.sessionToken, 1, true);
  });

  joinBtn.addEventListener('click', () =>
    showJoinInput(root, username, cachedIdentity, onStart, onCancel),
  );
  cancelBtn.addEventListener('click', onCancel);
}

function showJoinInput(
  root: HTMLElement,
  username: string,
  cachedIdentity: PlayerIdentity | null,
  onStart: Parameters<typeof renderLobbyScreen>[2],
  onCancel: () => void,
): void {
  clear(root);
  const s       = el('section', { className: 'screen' });
  const input   = el('input', { type: 'text', maxlength: '4', placeholder: '1234', className: 'session-code-input' }) as HTMLInputElement;
  const join2   = el('button', { type: 'button', className: 'btn primary' }, ['Unirse']) as HTMLButtonElement;
  const errMsg  = el('p', { className: 'error' }, ['']);
  const backBtn = el('button', { type: 'button', className: 'btn ghost' }, ['← Volver']) as HTMLButtonElement;

  join2.addEventListener('click', async () => {
    const identity = cachedIdentity;
    if (!identity) { errMsg.textContent = 'Sin identidad. Volvé al lobby.'; return; }
    join2.disabled = true;
    errMsg.textContent = 'Uniéndose…';
    const result = await joinSession(input.value.trim(), identity.playerId, identity.sessionToken);
    if ('error' in result) {
      errMsg.className = 'error';
      errMsg.textContent = result.error;
      join2.disabled = false;
      return;
    }
    onStart(result.sessionId, result.code, identity.playerId, identity.sessionToken, result.playerCount, false);
  });

  backBtn.addEventListener('click', () =>
    renderLobbyScreen(root, username, onStart, onCancel),
  );

  s.append(
    el('h1', {}, ['Unirse a sala']),
    el('p', {}, ['Ingresa el código de 4 dígitos:']),
    input, errMsg,
    el('div', { className: 'btn-col' }, [join2, backBtn]),
  );
  root.append(s);
}
