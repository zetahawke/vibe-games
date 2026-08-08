import { ensureLocalAccount, hashPassword, login } from '@/domain/auth/auth';
import { rememberPin, resolveIdentity } from '@/domain/online/playerService';
import { clear, el } from '@/shared/dom';

export function renderLoginScreen(
  root: HTMLElement,
  onSuccess: (username: string) => void,
): void {
  clear(root);

  const error = el('p', { className: 'error', role: 'alert' });
  const userInput = el('input', {
    type: 'text',
    id: 'username',
    autocomplete: 'username',
    placeholder: 'Usuario',
  }) as HTMLInputElement;
  const passInput = el('input', {
    type: 'password',
    id: 'password',
    autocomplete: 'current-password',
    placeholder: 'Contraseña',
  }) as HTMLInputElement;

  const enterBtn = el('button', { type: 'button', className: 'btn primary' }, ['Entrar']);
  const createBtn = el('button', { type: 'button', className: 'btn' }, ['Crear jugador']);

  async function enterOnline(username: string, password: string): Promise<string | null> {
    const local = await ensureLocalAccount(username, password);
    if (!local.ok) return local.error;
    const session = await login(username, password);
    if (!session.ok) return session.error;
    const pin = await hashPassword(password);
    rememberPin(pin);
    const online = await resolveIdentity(session.username, pin);
    if ('error' in online) {
      error.className = 'muted';
      error.textContent = `${online.error} Podés jugar sin conexión.`;
    }
    return null;
  }

  enterBtn.addEventListener('click', async () => {
    error.textContent = '';
    error.className = 'error';
    enterBtn.setAttribute('disabled', 'true');
    createBtn.setAttribute('disabled', 'true');
    const fail = await enterOnline(userInput.value, passInput.value);
    enterBtn.removeAttribute('disabled');
    createBtn.removeAttribute('disabled');
    if (fail) {
      error.textContent = fail;
      return;
    }
    const session = await login(userInput.value, passInput.value);
    if (!session.ok) {
      error.textContent = session.error;
      return;
    }
    onSuccess(session.username);
  });

  createBtn.addEventListener('click', async () => {
    error.textContent = '';
    error.className = 'error';
    enterBtn.setAttribute('disabled', 'true');
    createBtn.setAttribute('disabled', 'true');
    const fail = await enterOnline(userInput.value, passInput.value);
    enterBtn.removeAttribute('disabled');
    createBtn.removeAttribute('disabled');
    if (fail) {
      error.textContent = fail;
      return;
    }
    const session = await login(userInput.value, passInput.value);
    if (!session.ok) {
      error.textContent = session.error;
      return;
    }
    onSuccess(session.username);
  });

  root.append(
    el('section', { className: 'screen login-screen' }, [
      el('h1', {}, ['Juegos de Casa']),
      el('p', { className: 'subtitle' }, ['Entra o crea un jugador']),
      el('label', { for: 'username' }, ['Usuario']),
      userInput,
      el('label', { for: 'password' }, ['Contraseña']),
      passInput,
      error,
      el('div', { className: 'btn-row' }, [enterBtn, createBtn]),
    ]),
  );
}
