import { el, clear } from '@/shared/dom';
import {
  adminSignIn,
  adminSignOut,
  startSeason,
  endSeason,
  fetchTopPlayers,
} from '@/domain/admin/adminService';

export function renderAdminScreen(root: HTMLElement, onBack: () => void): void {
  clear(root);

  const userInput = el('input', { type: 'text', placeholder: 'Usuario', className: 'input', autocomplete: 'username' }) as HTMLInputElement;
  const passInput  = el('input', { type: 'password', placeholder: 'Contraseña', className: 'input', autocomplete: 'current-password' }) as HTMLInputElement;
  const loginBtn   = el('button', { type: 'button',  className: 'btn primary' }, ['Ingresar']);
  const errMsg     = el('p', { className: 'error' }, ['']);

  const loginSection = el('section', { className: 'screen' }, [
    el('h1', {}, ['Admin']),
    userInput, passInput, errMsg, loginBtn,
  ]);
  root.append(loginSection);

  loginBtn.addEventListener('click', async () => {
    (loginBtn as HTMLButtonElement).disabled = true;
    errMsg.textContent = '';
    const result = await adminSignIn(userInput.value.trim(), passInput.value);
    if (result.error || !result.token) {
      errMsg.textContent = result.error ?? 'Error obteniendo sesión.';
      (loginBtn as HTMLButtonElement).disabled = false;
      return;
    }
    await renderDashboard(root, onBack, result.token);
  });
}

async function renderDashboard(
  root: HTMLElement,
  onBack: () => void,
  token: string,
): Promise<void> {
  clear(root);
  const section = el('section', { className: 'screen admin-panel' });

  const nameInput = el('input', { type: 'text', placeholder: 'Nombre de temporada', className: 'input' }) as HTMLInputElement;
  const startBtn  = el('button', { type: 'button', className: 'btn primary' }, ['Iniciar temporada']);
  const endBtn    = el('button', { type: 'button', className: 'btn' },         ['Terminar temporada activa']);
  const statusMsg = el('p', {}, ['']);

  startBtn.addEventListener('click', async () => {
    const result = await startSeason(nameInput.value.trim() || 'Temporada', token);
    statusMsg.textContent = result.error ?? 'Temporada iniciada.';
    statusMsg.className = result.error ? 'error' : '';
  });
  endBtn.addEventListener('click', async () => {
    const result = await endSeason(token);
    statusMsg.textContent = result.error ?? 'Temporada terminada.';
    statusMsg.className = result.error ? 'error' : '';
  });

  const topList = el('ol', { className: 'admin-top-list' });
  const stats = await fetchTopPlayers(token, 10);
  if (stats.error) {
    topList.append(el('li', { className: 'error' }, [stats.error]));
  } else {
    stats.players.forEach((p) => {
      topList.append(el('li', {}, [`${p.username} — ${p.totalScore} pts`]));
    });
  }

  const logoutBtn = el('button', { type: 'button', className: 'btn ghost' }, ['Cerrar sesión']);
  logoutBtn.addEventListener('click', async () => {
    await adminSignOut();
    onBack();
  });

  const backBtn = el('button', { type: 'button', className: 'btn ghost' }, ['← Salir']);
  backBtn.addEventListener('click', onBack);

  section.append(
    el('h1', {}, ['Panel de administración']),
    el('h2', {}, ['Temporadas']),
    nameInput, startBtn, endBtn, statusMsg,
    el('h2', {}, ['Top 10 jugadores']),
    topList,
    el('div', { className: 'btn-row' }, [logoutBtn, backBtn]),
  );
  root.append(section);
}
