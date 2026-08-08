import { el, clear } from '@/shared/dom';
import { CHILE_GRADES, type ChileGrade } from '@/domain/profile/profile';
import {
  adminSignIn,
  adminSignOut,
  closeAdminSession,
  deleteAdminPlayer,
  endSeason,
  fetchAdminPlayers,
  fetchAdminSessions,
  fetchAdminStats,
  patchAdminPlayer,
  startSeason,
  type AdminPlayerRow,
  type AdminSessionRow,
} from '@/domain/admin/adminService';

export function renderAdminScreen(root: HTMLElement, onBack: () => void): void {
  clear(root);

  const userInput = el('input', { type: 'text', placeholder: 'Usuario', className: 'input', autocomplete: 'username' }) as HTMLInputElement;
  const passInput = el('input', { type: 'password', placeholder: 'Contraseña', className: 'input', autocomplete: 'current-password' }) as HTMLInputElement;
  const loginBtn = el('button', { type: 'button', className: 'btn primary' }, ['Ingresar']);
  const errMsg = el('p', { className: 'error' }, ['']);

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

async function renderDashboard(root: HTMLElement, onBack: () => void, token: string): Promise<void> {
  clear(root);
  const section = el('section', { className: 'screen admin-panel' });
  const statusMsg = el('p', { className: 'admin-status' }, ['Cargando…']);
  section.append(el('h1', {}, ['Panel de administración']), statusMsg);
  root.append(section);

  const [stats, players, sessions] = await Promise.all([
    fetchAdminStats(token, 15),
    fetchAdminPlayers(token),
    fetchAdminSessions(token),
  ]);

  clear(section);
  const flash = el('p', { className: 'admin-status' }, ['']);
  const setFlash = (msg: string, err = false) => {
    flash.textContent = msg;
    flash.className = err ? 'error' : 'admin-status';
  };

  const logoutBtn = el('button', { type: 'button', className: 'btn ghost' }, ['Cerrar sesión']);
  logoutBtn.addEventListener('click', async () => {
    await adminSignOut();
    onBack();
  });
  const backBtn = el('button', { type: 'button', className: 'btn ghost' }, ['← Salir']);
  backBtn.addEventListener('click', onBack);

  section.append(
    el('h1', {}, ['Panel de administración']),
    flash,
    buildPlayersBlock(token, players.players, players.error, setFlash, () => renderDashboard(root, onBack, token)),
    buildSeasonsBlock(token, stats, setFlash, () => renderDashboard(root, onBack, token)),
    buildSessionsBlock(token, sessions.sessions, sessions.error, setFlash, () => renderDashboard(root, onBack, token)),
    el('div', { className: 'btn-row' }, [logoutBtn, backBtn]),
  );
}

function buildPlayersBlock(
  token: string,
  players: AdminPlayerRow[],
  error: string | undefined,
  setFlash: (msg: string, err?: boolean) => void,
  reload: () => void,
): HTMLElement {
  const wrap = el('section', { className: 'admin-block' }, [
    el('h2', {}, ['Jugadores']),
  ]);
  if (error) {
    wrap.append(el('p', { className: 'error' }, [error]));
    return wrap;
  }
  const table = el('table', { className: 'admin-table' });
  table.append(el('thead', {}, [
    el('tr', {}, [
      el('th', {}, ['Usuario']),
      el('th', {}, ['Grado']),
      el('th', {}, ['PIN']),
      el('th', {}, ['']),
    ]),
  ]));
  const body = el('tbody');
  for (const p of players) {
    const gradeSel = el('select', { className: 'admin-select' }) as HTMLSelectElement;
    for (const g of CHILE_GRADES) {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.label;
      if (g.id === p.grade) opt.selected = true;
      gradeSel.append(opt);
    }
    gradeSel.addEventListener('change', async () => {
      const r = await patchAdminPlayer(token, p.id, { grade: gradeSel.value as ChileGrade });
      setFlash(r.error ?? `Grado de ${p.username} actualizado.`, Boolean(r.error));
    });

    const pinInput = el('input', {
      type: 'text',
      className: 'admin-pin',
      placeholder: 'Nuevo PIN',
    }) as HTMLInputElement;
    const resetBtn = el('button', { type: 'button', className: 'btn ghost admin-tiny' }, ['Reset']);
    resetBtn.addEventListener('click', async () => {
      if (pinInput.value.trim().length < 4) {
        setFlash('PIN mínimo 4 caracteres.', true);
        return;
      }
      const r = await patchAdminPlayer(token, p.id, { pin: pinInput.value.trim() });
      pinInput.value = '';
      setFlash(r.error ?? `PIN de ${p.username} restablecido.`, Boolean(r.error));
    });

    const delBtn = el('button', { type: 'button', className: 'btn ghost admin-tiny' }, ['Borrar']);
    delBtn.addEventListener('click', async () => {
      if (!confirm(`¿Borrar a ${p.username}?`)) return;
      const r = await deleteAdminPlayer(token, p.id);
      if (r.error) setFlash(r.error, true);
      else reload();
    });

    body.append(el('tr', {}, [
      el('td', {}, [p.username]),
      el('td', {}, [gradeSel]),
      el('td', {}, [el('div', { className: 'admin-inline' }, [pinInput, resetBtn])]),
      el('td', {}, [delBtn]),
    ]));
  }
  table.append(body);
  wrap.append(table);
  return wrap;
}

function buildSeasonsBlock(
  token: string,
  stats: Awaited<ReturnType<typeof fetchAdminStats>>,
  setFlash: (msg: string, err?: boolean) => void,
  reload: () => void,
): HTMLElement {
  const wrap = el('section', { className: 'admin-block' }, [el('h2', {}, ['Temporadas'])]);
  wrap.append(el('p', { className: 'muted' }, [
    stats.season ? `Activa: ${stats.season.name}` : 'No hay temporada activa.',
  ]));

  const nameInput = el('input', { type: 'text', placeholder: 'Nombre de temporada', className: 'input' }) as HTMLInputElement;
  const startBtn = el('button', { type: 'button', className: 'btn primary' }, ['Iniciar temporada']);
  const endBtn = el('button', { type: 'button', className: 'btn' }, ['Terminar temporada activa']);
  startBtn.addEventListener('click', async () => {
    const result = await startSeason(nameInput.value.trim() || 'Temporada', token);
    if (result.error) setFlash(result.error, true);
    else reload();
  });
  endBtn.addEventListener('click', async () => {
    const result = await endSeason(token);
    if (result.error) setFlash(result.error, true);
    else reload();
  });
  wrap.append(nameInput, el('div', { className: 'btn-row' }, [startBtn, endBtn]));

  if (stats.error) {
    wrap.append(el('p', { className: 'error' }, [stats.error]));
    return wrap;
  }

  wrap.append(el('h3', {}, ['Puntajes agregados']));
  const table = el('table', { className: 'admin-table' });
  table.append(el('thead', {}, [
    el('tr', {}, [
      el('th', {}, ['Jugador']),
      el('th', {}, ['Total']),
      el('th', {}, ['Partidas']),
      el('th', {}, ['Mejor']),
    ]),
  ]));
  const body = el('tbody');
  for (const p of stats.players) {
    body.append(el('tr', {}, [
      el('td', {}, [p.username]),
      el('td', {}, [String(p.totalScore)]),
      el('td', {}, [String(p.matches)]),
      el('td', {}, [String(p.bestScore)]),
    ]));
  }
  if (stats.players.length === 0) {
    body.append(el('tr', {}, [el('td', { colspan: '4' }, ['Sin partidas registradas.'])]));
  }
  table.append(body);
  wrap.append(table);
  return wrap;
}

function buildSessionsBlock(
  token: string,
  sessions: AdminSessionRow[],
  error: string | undefined,
  setFlash: (msg: string, err?: boolean) => void,
  reload: () => void,
): HTMLElement {
  const wrap = el('section', { className: 'admin-block' }, [el('h2', {}, ['Salas abiertas'])]);
  if (error) {
    wrap.append(el('p', { className: 'error' }, [error]));
    return wrap;
  }
  const table = el('table', { className: 'admin-table' });
  table.append(el('thead', {}, [
    el('tr', {}, [
      el('th', {}, ['Código']),
      el('th', {}, ['Host']),
      el('th', {}, ['Jugadores']),
      el('th', {}, ['Estado']),
      el('th', {}, ['']),
    ]),
  ]));
  const body = el('tbody');
  for (const s of sessions) {
    const closeBtn = el('button', { type: 'button', className: 'btn ghost admin-tiny' }, ['Cerrar']);
    closeBtn.addEventListener('click', async () => {
      const r = await closeAdminSession(token, s.id);
      if (r.error) setFlash(r.error, true);
      else reload();
    });
    body.append(el('tr', {}, [
      el('td', {}, [s.code]),
      el('td', {}, [s.host]),
      el('td', {}, [s.players.join(', ') || '—']),
      el('td', {}, [s.status]),
      el('td', {}, [closeBtn]),
    ]));
  }
  if (sessions.length === 0) {
    body.append(el('tr', {}, [el('td', { colspan: '5' }, ['No hay salas abiertas.'])]));
  }
  table.append(body);
  wrap.append(table);
  return wrap;
}
