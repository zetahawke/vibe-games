import { MAX_LIVES } from '@/config/gameConfig';

export function quizCoinMultiplier(wave: number): number {
  return 1 + Math.max(0, wave - 1) * 0.1;
}

export function quizCoinsForWave(baseCoins: number, wave: number): number {
  return Math.round(baseCoins * quizCoinMultiplier(wave));
}

export function shouldHealOnWave(wavesCleared: number): boolean {
  return wavesCleared > 0 && wavesCleared % 5 === 0;
}

export function streakBonusCoins(currentCoins: number, streak: number): number {
  if (streak <= 0 || streak % 5 !== 0) return 0;
  return Math.floor(currentCoins * 0.2);
}

export { MAX_LIVES };
