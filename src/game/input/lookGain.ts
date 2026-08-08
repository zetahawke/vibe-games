export type LookDevice = 'mouse' | 'touch';

/** Relative to the previous 1:1 pixel delta. */
export const LOOK_GAIN: Record<LookDevice, number> = {
  mouse: 0.8,
  touch: 1.3,
};

export function applyLookGain(
  dx: number,
  dy: number,
  device: LookDevice,
): { dx: number; dy: number } {
  const g = LOOK_GAIN[device];
  return { dx: dx * g, dy: dy * g };
}
