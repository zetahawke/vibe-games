import { ANIMAL_IDS, type AnimalId } from './catalog';

export { ANIMAL_IDS, type AnimalId };

export function pickRound(rng: () => number = Math.random): AnimalId[] {
  const count = rng() < 0.5 ? 3 : 4;
  const pool = [...ANIMAL_IDS];
  const out: AnimalId[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out;
}
