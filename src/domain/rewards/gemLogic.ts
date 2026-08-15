export const GEM_STREAK_LEN = 5;

export function registerStreakSuccess(streak: number): { streak: number; gemsAwarded: number } {
  const next = streak + 1;
  if (next >= GEM_STREAK_LEN) return { streak: 0, gemsAwarded: 1 };
  return { streak: next, gemsAwarded: 0 };
}

export function resetStreak(): number {
  return 0;
}
