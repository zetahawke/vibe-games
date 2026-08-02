export const WAVE_DURATION_MS = 60_000;
export const REST_DURATION_MS = 60_000;
export const MAX_LIVES = 3;
export const COINS_PER_ZOMBIE = 1;
export const QUIZ_MAX_ATTEMPTS = 3;
export const STORAGE_PREFIX = 'juegos-de-casa:v1:';

export type MathTopic = 'sumas' | 'restas' | 'multiplicaciones' | 'divisiones' | 'mixto';

export const QUIZ_REWARDS: Record<number, number> = {
  1: 4,
  2: 10,
  3: 20,
};
