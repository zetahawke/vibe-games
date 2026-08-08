import type { AnimalId } from './catalog';
import type { GraphicsStyle } from './settings';
import { animalSvg } from './visuals';

/** Public URL for a realistic PNG portrait. */
export function animalPhotoUrl(id: AnimalId): string {
  return `/animals/images/${id}.png`;
}

/** Public URL for the pre-recorded spoken name. */
export function animalSoundUrl(id: AnimalId): string {
  return `/animals/sounds/${id}.mp3`;
}

/**
 * Markup for the animal art slot.
 * Realistic pieces use PNG; shadows always use an SVG silhouette so there is a shape to match.
 */
export function animalArtHtml(
  id: AnimalId,
  style: GraphicsStyle,
  variant: 'color' | 'shadow',
): string {
  if (style === 'realistic' && variant === 'color') {
    return `<img src="${animalPhotoUrl(id)}" alt="${id}" draggable="false" />`;
  }
  return animalSvg(id, variant);
}
