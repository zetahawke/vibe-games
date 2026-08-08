/** Fort at -Z; path runs toward +Z. Sizes relative to the original layout. */
export const FORT_HALF = 3.5 * 2.5;    // 150% wider
export const FORT_HEIGHT = 2.4 * 4;    // 300% taller
export const PATH_HALF_W_BASE = 5 * 1.2; // 20% wider
export const PATH_END_Z = 52 * 1.5;    // 50% longer

/** Path/entrance half-width for a match: base ±20%. */
export function rollPathHalfWidth(): number {
  return PATH_HALF_W_BASE * (0.8 + Math.random() * 0.4);
}
