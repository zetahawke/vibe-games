import { el } from './dom';

/**
 * Creates a full-screen dimmed overlay containing a centred card.
 * Returns both so callers can populate the card and append the overlay.
 */
export function makeOverlayCard(extraCardClass?: string): {
  overlay: HTMLElement;
  card: HTMLElement;
} {
  const overlay = el('div', { className: 'overlay' });
  const card = el('div', {
    className: extraCardClass ? `overlay-card ${extraCardClass}` : 'overlay-card',
  });
  overlay.append(card);
  return { overlay, card };
}
