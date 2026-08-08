import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveIdentity } from '@/domain/online/playerService';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('resolveIdentity after local wipe', () => {
  it('recovers the existing DB player with the same PIN', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ playerId: 'p1', sessionToken: 'tok-new' }), { status: 200 }),
    );

    const result = await resolveIdentity('papa', 'pin-hash');
    expect(result).toMatchObject({ playerId: 'p1', sessionToken: 'tok-new', username: 'papa' });
    expect(sessionStorage.getItem('game_player_id')).toBe('p1');
  });
});
