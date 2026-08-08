/** Clamp a quiz difficulty value to the valid range [1, 3]. */
export function clampDifficulty(difficulty: number): number {
  return Math.min(3, Math.max(1, Math.floor(difficulty)));
}
