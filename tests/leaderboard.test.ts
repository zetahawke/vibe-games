import { describe, expect, it } from 'vitest';
import { bestEntriesPerPlayer, embeddedUsername } from '@/domain/score/leaderboard';

describe('bestEntriesPerPlayer', () => {
  it('keeps only the highest personal score per username', () => {
    const rows = [
      { username: 'papa', personalScore: 40, coinsEarned: 10, lastWeapon: 'knife' },
      { username: 'hija', personalScore: 80, coinsEarned: 20, lastWeapon: 'pistol' },
      { username: 'papa', personalScore: 120, coinsEarned: 50, lastWeapon: 'rifle' },
      { username: 'papa', personalScore: 90, coinsEarned: 30, lastWeapon: 'shotgun' },
    ];
    expect(bestEntriesPerPlayer(rows, 10)).toEqual([
      { username: 'papa', personalScore: 120, coinsEarned: 50, lastWeapon: 'rifle' },
      { username: 'hija', personalScore: 80, coinsEarned: 20, lastWeapon: 'pistol' },
    ]);
  });

  it('caps the ranked list', () => {
    const rows = [
      { username: 'a', personalScore: 3, coinsEarned: 0, lastWeapon: 'knife' },
      { username: 'b', personalScore: 9, coinsEarned: 0, lastWeapon: 'knife' },
      { username: 'c', personalScore: 6, coinsEarned: 0, lastWeapon: 'knife' },
    ];
    expect(bestEntriesPerPlayer(rows, 2).map((e) => e.username)).toEqual(['b', 'c']);
  });
});

describe('embeddedUsername', () => {
  it('reads a many-to-one object or a one-row array from PostgREST', () => {
    expect(embeddedUsername({ username: 'hija' })).toBe('hija');
    expect(embeddedUsername([{ username: 'papa' }])).toBe('papa');
    expect(embeddedUsername(null)).toBe('Desconocido');
  });
});
