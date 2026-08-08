import { dispatchAction, type ApiHandler } from '../_http.js';
import profile from './_profile.js';
import recover from './_recover.js';
import register from './_register.js';
import verify from './_verify.js';

const handlers: Record<string, ApiHandler> = {
  profile,
  recover,
  register,
  verify,
};

export default async function handler(
  req: Parameters<typeof dispatchAction>[1],
  res: Parameters<typeof dispatchAction>[2],
): Promise<void> {
  await dispatchAction(handlers, req, res);
}
