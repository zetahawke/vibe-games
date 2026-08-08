import { describe, expect, it, vi, beforeEach } from 'vitest';

describe('MAX_SESSIONS', () => {
  it('is 6', async () => {
    const { MAX_SESSIONS } = await import('@/domain/online/sessionService');
    expect(MAX_SESSIONS).toBe(6);
  });
});

describe('createSession (mocked fetch)', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns error when server responds 409', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: 'No hay sala disponible. Intenta más tarde.' }),
        { status: 409 },
      ),
    );
    const { createSession } = await import('@/domain/online/sessionService');
    const result = await createSession('player-id', 'token');
    expect('error' in result).toBe(true);
    if ('error' in result) expect(result.error).toMatch(/sala/);
  });

  it('returns sessionId and code on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ sessionId: 'abc-123', code: '4567' }), { status: 200 }),
    );
    const { createSession } = await import('@/domain/online/sessionService');
    const result = await createSession('player-id', 'token');
    expect('sessionId' in result).toBe(true);
    if ('sessionId' in result) expect(result.code).toBe('4567');
  });
});
