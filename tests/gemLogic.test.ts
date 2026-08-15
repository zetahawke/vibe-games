import { describe, expect, it } from 'vitest';
import { GEM_STREAK_LEN, registerStreakSuccess, resetStreak } from '@/domain/rewards/gemLogic';

describe('gemLogic', () => {
  it('awards 1 gem every 5 successes', () => {
    let s = 0;
    let gems = 0;
    for (let i = 0; i < 5; i++) {
      const r = registerStreakSuccess(s);
      s = r.streak;
      gems += r.gemsAwarded;
    }
    expect(GEM_STREAK_LEN).toBe(5);
    expect(gems).toBe(1);
    expect(s).toBe(0);
  });

  it('resetStreak returns 0', () => {
    expect(resetStreak()).toBe(0);
  });
});
