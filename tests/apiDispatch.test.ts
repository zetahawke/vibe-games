import { describe, expect, it, vi } from 'vitest';
import { dispatchAction, type ApiHandler } from '../api/_http';

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(n: number) {
      res.statusCode = n;
      return res;
    },
    json(b: unknown) {
      res.body = b;
    },
    end() {},
  };
  return res;
}

describe('dispatchAction', () => {
  it('routes to the named handler', async () => {
    const create = vi.fn<ApiHandler>(async (_req, res) => {
      res.status(200).json({ ok: true });
    });
    const res = mockRes();
    await dispatchAction({ create }, { query: { action: 'create' }, headers: {}, body: {} }, res);
    expect(create).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it('returns 404 for unknown actions', async () => {
    const res = mockRes();
    await dispatchAction({}, { query: { action: 'nope' }, headers: {}, body: {} }, res);
    expect(res.statusCode).toBe(404);
  });
});
