/** True when the primary pointing device is touch (tablet/phone). */
export function isTouchPrimary(): boolean {
  if (typeof window === 'undefined') return false;

  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

  // Prefer fine pointer + hover (typical PC, including touchscreen laptops used with mouse)
  if (fineHover) return false;
  return coarse || (hasTouch && !window.matchMedia('(pointer: fine)').matches);
}
