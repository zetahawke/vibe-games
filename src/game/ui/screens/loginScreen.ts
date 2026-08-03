import { login, register } from '@/domain/auth/auth';
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

  enterBtn.addEventListener('click', async () => {
    error.textContent = '';
    const result = await login(userInput.value, passInput.value);
    if (!result.ok) {
      error.textContent = result.error;
      return;
    }
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
