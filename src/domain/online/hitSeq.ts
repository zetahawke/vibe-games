export interface SeqHit {
  seq: number;
  netId: number;
  dmg: number;
}

/** Hits the host has not applied yet, sorted by seq. */
export function takeNewHits(
  hits: SeqHit[],
  lastApplied: number,
): { hits: SeqHit[]; nextLast: number } {
  const fresh = hits
    .filter((h) => h.seq > lastApplied)
    .sort((a, b) => a.seq - b.seq);
  return {
    hits: fresh,
    nextLast: fresh.length ? fresh[fresh.length - 1]!.seq : lastApplied,
  };
}
