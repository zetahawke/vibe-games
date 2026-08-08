export const VISIBLE_MAX_STEP_MS = 50;
export const BACKGROUND_MAX_CATCH_UP_MS = 1000;

/** rAF freezes in background tabs; only the online host must keep simulating. */
export function shouldTickWhileHidden(isOnlineHost: boolean): boolean {
  return isOnlineHost;
}

/**
 * Visible tabs keep the old 50ms dt cap.
 * Hidden host tabs get 1s of catch-up in 50ms steps (Chrome throttles timers to ~1s).
 */
export function splitSimulationDt(
  elapsedMs: number,
  opts: { background: boolean },
  maxStepMs = VISIBLE_MAX_STEP_MS,
): number[] {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return [];
  const budget = Math.min(
    opts.background ? BACKGROUND_MAX_CATCH_UP_MS : maxStepMs,
    elapsedMs,
  );
  const steps: number[] = [];
  let left = budget;
  while (left > 0.0001) {
    const ms = Math.min(maxStepMs, left);
    steps.push(ms / 1000);
    left -= ms;
  }
  return steps;
}
