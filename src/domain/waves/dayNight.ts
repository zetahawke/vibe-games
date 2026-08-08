/** 3 day waves, then 2 night waves, repeating. */
export function isNightWave(wave: number): boolean {
  const w = Math.max(1, Math.floor(wave));
  return ((w - 1) % 5) >= 3;
}

export function nightSpeedMul(wave: number): number {
  return isNightWave(wave) ? 1.3 : 1;
}
