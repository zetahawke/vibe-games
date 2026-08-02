/** Fort at -Z, path runs toward +Z. Sizes relative to the first path layout. */
export const FORT_HALF = 3.5 * 2.5; // +150% más amplio
export const FORT_HEIGHT = 2.4 * 4; // +300% más alto
export const PATH_HALF_W_BASE = 5 * 1.2; // +20% más ancho
export const PATH_END_Z = 52 * 1.5; // +50% más largo

/** Path/entrance half-width for a match: base ±20%. */
export function rollPathHalfWidth(): number {
  return PATH_HALF_W_BASE * (0.8 + Math.random() * 0.4);
}
