import { dispatchAction, type ApiHandler } from '../_http.js';
import players from './_players.js';
import seasons from './_seasons.js';
import sessions from './_sessions.js';
import stats from './_stats.js';

const handlers: Record<string, ApiHandler> = {
  players,
  seasons,
  sessions,
  stats,
};

export default async function handler(
  req: Parameters<typeof dispatchAction>[1],
  res: Parameters<typeof dispatchAction>[2],
): Promise<void> {
  await dispatchAction(handlers, req, res);
}
