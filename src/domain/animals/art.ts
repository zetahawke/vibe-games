import type { AnimalId } from './catalog';
import type { GraphicsStyle } from './settings';
import { animalSvg } from './visuals';

/** Public URL for a realistic PNG portrait. */
export function animalPhotoUrl(id: AnimalId): string {
  return `/animals/${id}.png`;
}

/**
 * Markup for the animal art slot: SVG (dibujado) or <img> (realista).
 * Shadow variant for photos uses the same PNG + CSS filter on the container.
 */
export function animalArtHtml(
  id: AnimalId,
  style: GraphicsStyle,
  variant: 'color' | 'shadow',
): string {
  if (style === 'realista') {
    const alt = variant === 'shadow' ? '' : id;
    return `<img src="${animalPhotoUrl(id)}" alt="${alt}" draggable="false" />`;
  }
  return animalSvg(id, variant);
}
