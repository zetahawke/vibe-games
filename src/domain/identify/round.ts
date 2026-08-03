import { poolForTheme, type IdentifyId, type IdentifyTheme } from './catalog';

export function pickIdentifyRound(
  theme: IdentifyTheme,
  rng: () => number = Math.random,
): IdentifyId[] {
  const count = rng() < 0.5 ? 3 : 4;
  const pool = poolForTheme(theme);
  const out: IdentifyId[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}
