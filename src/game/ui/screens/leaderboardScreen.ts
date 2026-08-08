import { el, clear } from '@/shared/dom';

type Category = '1' | '2' | '3' | '4';

interface LeaderboardEntry {
  username: string;
  personalScore: number;
  coinsEarned: number;
  lastWeapon: string;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  seasonName: string | null;
}

export async function renderLeaderboardScreen(
  root: HTMLElement,
  onBack: () => void,
): Promise<void> {
  clear(root);
  const section = el('section', { className: 'screen' });
  root.append(section);

  // Fetch category 1 to check for active season and preload first tab.
  const probeRes  = await fetch('/api/leaderboard?playerCount=1');
  const probeJson = await probeRes.json() as LeaderboardResponse;

  if (!probeJson.seasonName) {
    section.append(
      el('h1', {}, ['Clasificación']),
      el('p', { className: 'muted' }, ['No hay una temporada activa.']),
    );
    const backBtn = el('button', { type: 'button', className: 'btn ghost' }, ['← Volver']);
    backBtn.addEventListener('click', onBack);
    section.append(backBtn);
    return;
  }

  section.append(el('h1', {}, [`Clasificación — ${probeJson.seasonName}`]));

  const tabs    = el('div', { className: 'leaderboard-tabs' });
  const content = el('div', { className: 'leaderboard-content' });

  const categories: { id: Category; label: string }[] = [
    { id: '1', label: 'Solo' },
    { id: '2', label: '2P' },
    { id: '3', label: '3P' },
    { id: '4', label: '4P' },
  ];

  for (const cat of categories) {
    const tab = el('button', { type: 'button', className: 'btn ghost leaderboard-tab' }, [cat.label]);
    tab.addEventListener('click', () => void loadCategory(cat.id, content));
    tabs.append(tab);
  }

  // Category 1 already fetched — render without a second request.
  renderEntries(probeJson.entries, content);

  const backBtn = el('button', { type: 'button', className: 'btn ghost' }, ['← Volver']);
  backBtn.addEventListener('click', onBack);

  section.append(tabs, content, backBtn);
}

async function loadCategory(playerCount: Category, container: HTMLElement): Promise<void> {
  clear(container);
  container.append(el('p', {}, ['Cargando…']));

  const res  = await fetch(`/api/leaderboard?playerCount=${playerCount}`);
  const json = await res.json() as LeaderboardResponse;

  clear(container);
  renderEntries(json.entries ?? [], container);
}

function renderEntries(entries: LeaderboardEntry[], container: HTMLElement): void {
  if (!entries.length) {
    container.append(el('p', { className: 'muted' }, ['Sin entradas todavía.']));
    return;
  }

  const table = el('table', { className: 'leaderboard-table' });
  table.append(el('thead', {}, [
    el('tr', {}, [
      el('th', {}, ['#']),
      el('th', {}, ['Jugador']),
      el('th', {}, ['Puntos']),
      el('th', {}, ['Monedas']),
      el('th', {}, ['Arma']),
    ]),
  ]));
  const tbody = el('tbody', {});
  entries.forEach((entry, i) => {
    tbody.append(el('tr', {}, [
      el('td', {}, [String(i + 1)]),
      el('td', {}, [entry.username]),
      el('td', {}, [String(entry.personalScore)]),
      el('td', {}, [String(entry.coinsEarned)]),
      el('td', {}, [entry.lastWeapon]),
    ]));
  });
  table.append(tbody);
  container.append(table);
}
