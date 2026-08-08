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
  clear(root);
  const section = el('section', { className: 'screen' });

  section.append(el('h1', {}, ['Juego en línea']));

  const createBtn = el('button', { type: 'button', className: 'btn primary' }, ['➕ Crear sala']);
  const joinBtn   = el('button', { type: 'button', className: 'btn' },         ['🔗 Unirse a sala']);
  const cancelBtn = el('button', { type: 'button', className: 'btn ghost' },   ['← Volver']);
  const msg = el('p', { className: 'error' }, ['']);

  createBtn.addEventListener('click', async () => {
    (createBtn as HTMLButtonElement).disabled = true;
    msg.textContent = 'Verificando identidad…';
    const identity = await resolveIdentity(username);
    if ('error' in identity) {
      msg.textContent = identity.error;
      (createBtn as HTMLButtonElement).disabled = false;
      return;
    }
    msg.textContent = 'Creando sala…';
    const result = await createSession(identity.playerId, identity.sessionToken);
    if ('error' in result) {
      msg.textContent = result.error;
      (createBtn as HTMLButtonElement).disabled = false;
      return;
    }
    showWaitingCode(result.sessionId, result.code, identity);
  });

  joinBtn.addEventListener('click', () => showJoinInput());
  cancelBtn.addEventListener('click', onCancel);

  section.append(el('div', { className: 'btn-col' }, [createBtn, joinBtn, cancelBtn]), msg);
  root.append(section);

  function showWaitingCode(sessionId: string, code: string, identity: PlayerIdentity): void {
    clear(root);
    const s = el('section', { className: 'screen' });
    s.append(
      el('h1', {}, ['Sala creada']),
      el('p', {}, ['Comparte este código con tus amigos:']),
      el('h2', { className: 'session-code' }, [code]),
      el('p', { className: 'muted' }, ['Esperando jugadores… (máx. 4)']),
    );
    const startBtn   = el('button', { type: 'button', className: 'btn primary' }, ['▶ Comenzar']);
    const cancelBtn2 = el('button', { type: 'button', className: 'btn ghost' },   ['Cancelar']);
    startBtn.addEventListener('click', () =>
      onStart(sessionId, code, identity.playerId, identity.sessionToken, 1, true),
    );
    cancelBtn2.addEventListener('click', onCancel);
    s.append(el('div', { className: 'btn-col' }, [startBtn, cancelBtn2]));
    root.append(s);
  }

  function showJoinInput(): void {
    clear(root);
    const s      = el('section', { className: 'screen' });
    const input  = el('input', { type: 'text', maxlength: '4', placeholder: '1234', className: 'session-code-input' }) as HTMLInputElement;
    const join2  = el('button', { type: 'button', className: 'btn primary' }, ['Unirse']);
    const errMsg = el('p', { className: 'error' }, ['']);
    const backBtn = el('button', { type: 'button', className: 'btn ghost' }, ['← Volver']);

    join2.addEventListener('click', async () => {
      (join2 as HTMLButtonElement).disabled = true;
      errMsg.textContent = 'Verificando identidad…';
      const identity = await resolveIdentity(username);
      if ('error' in identity) {
        errMsg.textContent = identity.error;
        (join2 as HTMLButtonElement).disabled = false;
        return;
      }
      errMsg.textContent = 'Uniéndose…';
      const result = await joinSession(input.value.trim(), identity.playerId, identity.sessionToken);
      if ('error' in result) {
        errMsg.textContent = result.error;
        (join2 as HTMLButtonElement).disabled = false;
        return;
      }
      onStart(result.sessionId, input.value.trim(), identity.playerId, identity.sessionToken, result.playerCount, false);
    });
    backBtn.addEventListener('click', () => renderLobbyScreen(root, username, onStart, onCancel));

    s.append(
      el('h1', {}, ['Unirse a sala']),
      el('p', {}, ['Ingresa el código de 4 dígitos:']),
      input, errMsg,
      el('div', { className: 'btn-col' }, [join2, backBtn]),
    );
    root.append(s);
  }
}
