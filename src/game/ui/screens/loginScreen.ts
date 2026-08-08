import { login, register, hashPassword } from '@/domain/auth/auth';
import { resolveIdentity } from '@/domain/online/playerService';
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

  async function syncOnline(username: string, password: string): Promise<void> {
    // Use SHA-256 hash of the password as PIN — raw password never leaves the client.
    const pin = await hashPassword(password);
    void resolveIdentity(username, pin).catch(() => undefined);
  }

  enterBtn.addEventListener('click', async () => {
    error.textContent = '';
    const result = await login(userInput.value, passInput.value);
    if (!result.ok) {
      error.textContent = result.error;
      return;
    }
    void syncOnline(result.username, passInput.value);
    onSuccess(result.username);
  });

  createBtn.addEventListener('click', async () => {
    error.textContent = '';
    const created = await register(userInput.value, passInput.value);
    if (!created.ok) {
      error.textContent = created.error;
      return;
    }
    const result = await login(userInput.value, passInput.value);
    if (!result.ok) {
      error.textContent = result.error;
      return;
    }
    void syncOnline(result.username, passInput.value);
    onSuccess(result.username);
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
