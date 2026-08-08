/** Maximum skip coins a player can hold at once. */
export const SKIP_COINS_MAX = 2;

/**
 * True when a skip coin should be awarded.
 * Fires every 10 waves cleared (10, 20, 30, …).
 */
export function shouldAwardSkipCoin(wavesCleared: number): boolean {
  return wavesCleared > 0 && wavesCleared % 10 === 0;
}

/** True when the player has at least one skip coin to spend. */
export function canSkipWave(skipCoins: number): boolean {
  return skipCoins > 0;
}
