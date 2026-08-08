import { dispatchAction, type ApiHandler } from '../_http.js';
import close from './_close.js';
import create from './_create.js';
import join from './_join.js';
import leave from './_leave.js';

const handlers: Record<string, ApiHandler> = {
  close,
  create,
  join,
  leave,
};

export default async function handler(
  req: Parameters<typeof dispatchAction>[1],
  res: Parameters<typeof dispatchAction>[2],
): Promise<void> {
  await dispatchAction(handlers, req, res);
}
