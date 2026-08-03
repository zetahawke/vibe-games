import { getDropMode, setDropMode, type DropMode } from '@/domain/animals';
import { el } from '@/shared/dom';

const MODES: { id: DropMode; label: string; hint: string }[] = [
  { id: 'libre', label: 'Libre', hint: 'Si falla, vuelve sin aviso.' },
  { id: 'suave', label: 'Suave', hint: 'Si falla, tiembla un poquito.' },
  { id: 'guiado', label: 'Guiado', hint: 'Solo encaja en la sombra correcta.' },
];

export function renderAnimalsSettingsOverlay(
  parent: HTMLElement,
  username: string,
  onPlay: (mode: DropMode) => void,
  onCancel: () => void,
): HTMLElement {
  const overlay = el('div', { className: 'overlay animals-settings-overlay' });
  const card = el('div', { className: 'overlay-card' });
  overlay.append(card);

  let selected = getDropMode(username);

  card.append(
    el('h2', {}, ['Animales']),
    el('p', {}, ['Elige cómo soltar los animales:']),
  );

  const list = el('div', { className: 'animals-mode-list' });
  const radios: HTMLInputElement[] = [];

  for (const m of MODES) {
    const id = `animals-mode-${m.id}`;
    const label = el('label', { className: 'animals-mode-option', for: id });
    const input = el('input', {
      type: 'radio',
      name: 'animals-drop-mode',
      id,
      value: m.id,
    }) as HTMLInputElement;
    if (m.id === selected) input.checked = true;
    input.addEventListener('change', () => {
      if (input.checked) selected = m.id;
    });
    radios.push(input);
    label.append(input, el('strong', {}, [m.label]), el('span', { className: 'muted' }, [m.hint]));
    list.append(label);
  }
  card.append(list);

  const actions = el('div', { className: 'card-actions' });
  const play = el('button', { type: 'button', className: 'btn primary' }, [
    'Jugar',
  ]) as HTMLButtonElement;
  const cancel = el('button', { type: 'button', className: 'btn' }, [
    'Cancelar',
  ]) as HTMLButtonElement;

  play.addEventListener('click', () => {
    const checked = radios.find((r) => r.checked);
    const mode = (checked?.value as DropMode | undefined) ?? selected;
    setDropMode(username, mode);
    overlay.remove();
    onPlay(mode);
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
