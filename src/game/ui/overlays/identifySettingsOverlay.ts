import type { DropMode } from '@/domain/animals/dropRules';
import {
  getIdentifySettings,
  setIdentifySettings,
  type IdentifyTheme,
} from '@/domain/identify';
import { el } from '@/shared/dom';

const THEMES: { id: IdentifyTheme; label: string }[] = [
  { id: 'vocales', label: 'Vocales' },
  { id: 'numeros', label: 'Números' },
  { id: 'abecedario', label: 'Abecedario' },
];

const MODES: { id: DropMode; label: string; hint: string }[] = [
  { id: 'libre', label: 'Libre', hint: 'Si falla, vuelve sin aviso.' },
  { id: 'suave', label: 'Suave', hint: 'Si falla, tiembla un poquito.' },
  { id: 'guiado', label: 'Guiado', hint: 'Solo encaja en la sombra correcta.' },
];

export function renderIdentifySettingsOverlay(
  parent: HTMLElement,
  username: string,
  onPlay: (theme: IdentifyTheme, dropMode: DropMode) => void,
  onCancel: () => void,
): HTMLElement {
  const overlay = el('div', { className: 'overlay identify-settings-overlay' });
  const card = el('div', { className: 'overlay-card' });
  overlay.append(card);

  const saved = getIdentifySettings(username);
  let theme = saved.theme;
  let dropMode = saved.dropMode;

  card.append(el('h2', {}, ['Identificar']));

  card.append(el('p', { className: 'animals-settings-section' }, ['Temática:']));
  const themeList = el('div', { className: 'animals-mode-list' });
  for (const t of THEMES) {
    const id = `identify-theme-${t.id}`;
    const label = el('label', { className: 'animals-mode-option', for: id });
    const input = el('input', {
      type: 'radio',
      name: 'identify-theme',
      id,
      value: t.id,
    }) as HTMLInputElement;
    if (t.id === theme) input.checked = true;
    input.addEventListener('change', () => {
      if (input.checked) theme = t.id;
    });
    label.append(input, el('strong', {}, [t.label]));
    themeList.append(label);
  }
  card.append(themeList);

  card.append(el('p', { className: 'animals-settings-section' }, ['Cómo soltar:']));
  const modeList = el('div', { className: 'animals-mode-list' });
  for (const m of MODES) {
    const id = `identify-mode-${m.id}`;
    const label = el('label', { className: 'animals-mode-option', for: id });
    const input = el('input', {
      type: 'radio',
      name: 'identify-drop-mode',
      id,
      value: m.id,
    }) as HTMLInputElement;
    if (m.id === dropMode) input.checked = true;
    input.addEventListener('change', () => {
      if (input.checked) dropMode = m.id;
    });
    label.append(input, el('strong', {}, [m.label]), el('span', { className: 'muted' }, [m.hint]));
    modeList.append(label);
  }
  card.append(modeList);

  const actions = el('div', { className: 'card-actions' });
  const play = el('button', { type: 'button', className: 'btn primary' }, [
    'Jugar',
  ]) as HTMLButtonElement;
  const cancel = el('button', { type: 'button', className: 'btn' }, [
    'Cancelar',
  ]) as HTMLButtonElement;

  play.addEventListener('click', () => {
    setIdentifySettings(username, { theme, dropMode });
    overlay.remove();
    onPlay(theme, dropMode);
  });
  cancel.addEventListener('click', () => {
    overlay.remove();
    onCancel();
  });

  actions.append(play, cancel);
  card.append(actions);
  parent.append(overlay);
  return overlay;
}
