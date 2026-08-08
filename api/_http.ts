export type ApiReq = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
  query: Record<string, string | string[] | undefined>;
};

export type ApiRes = {
  status: (n: number) => ApiRes;
  json: (b: unknown) => void;
  end: () => void;
};

export type ApiHandler = (req: ApiReq, res: ApiRes) => Promise<void>;

export async function dispatchAction(
  handlers: Record<string, ApiHandler>,
  req: ApiReq,
  res: ApiRes,
): Promise<void> {
  const raw = req.query.action;
  const action = Array.isArray(raw) ? raw[0] : raw;
  const fn = action ? handlers[action] : undefined;
  if (!fn) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }
  await fn(req, res);
}
