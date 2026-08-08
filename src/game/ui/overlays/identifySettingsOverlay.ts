import type { DropMode } from '@/domain/animals/dropRules';
import {
  getIdentifySettings,
  setIdentifySettings,
  type IdentifyTheme,
} from '@/domain/identify';
import { makeOverlayCard } from '@/shared/overlay';
import { el } from '@/shared/dom';

const THEMES: { id: IdentifyTheme; label: string }[] = [
  { id: 'vowels',   label: 'Vocales' },
  { id: 'numbers',  label: 'Números' },
  { id: 'alphabet', label: 'Abecedario' },
];

const MODES: { id: DropMode; label: string; hint: string }[] = [
  { id: 'free',   label: 'Libre',  hint: 'Si falla, vuelve sin aviso.' },
  { id: 'smooth', label: 'Suave',  hint: 'Si falla, tiembla un poquito.' },
  { id: 'guided', label: 'Guiado', hint: 'Solo encaja en la sombra correcta.' },
];

function makeRadioGroup<T extends string>(
  items: { id: T; label: string; hint?: string }[],
  name: string,
  selected: T,
  onChange: (v: T) => void,
): HTMLElement {
  const list = el('div', { className: 'animals-mode-list' });
  for (const item of items) {
    const domId = `${name}-${item.id}`;
    const label = el('label', { className: 'animals-mode-option', for: domId });
    const input = el('input', { type: 'radio', name, id: domId, value: item.id }) as HTMLInputElement;
    if (item.id === selected) input.checked = true;
    input.addEventListener('change', () => { if (input.checked) onChange(item.id); });
    const children: Node[] = [input, el('strong', {}, [item.label])];
    if (item.hint) children.push(el('span', { className: 'muted' }, [item.hint]));
    label.append(...children);
    list.append(label);
  }
  return list;
}

export function renderIdentifySettingsOverlay(
  parent: HTMLElement,
  username: string,
  onPlay: (theme: IdentifyTheme, dropMode: DropMode) => void,
  onCancel: () => void,
): HTMLElement {
  const { overlay, card } = makeOverlayCard();
  overlay.classList.add('identify-settings-overlay');

  const saved = getIdentifySettings(username);
  let theme: IdentifyTheme = saved.theme;
  let dropMode: DropMode = saved.dropMode;

  card.append(
    el('h2', {}, ['Identificar']),
    el('p', { className: 'animals-settings-section' }, ['Temática:']),
    makeRadioGroup(THEMES, 'identify-theme', theme, (v) => { theme = v; }),
    el('p', { className: 'animals-settings-section' }, ['Cómo soltar:']),
    makeRadioGroup(MODES, 'identify-drop-mode', dropMode, (v) => { dropMode = v; }),
  );

  const play   = el('button', { type: 'button', className: 'btn primary' }, ['Jugar']) as HTMLButtonElement;
  const cancel = el('button', { type: 'button', className: 'btn' }, ['Cancelar']) as HTMLButtonElement;

  play.addEventListener('click', () => {
    setIdentifySettings(username, { theme, dropMode });
    overlay.remove();
    onPlay(theme, dropMode);
  });
  cancel.addEventListener('click', () => { overlay.remove(); onCancel(); });

  card.append(el('div', { className: 'card-actions' }, [play, cancel]));
  parent.append(overlay);
  return overlay;
}
