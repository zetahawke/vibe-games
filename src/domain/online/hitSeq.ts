export interface SeqHit {
  seq: number;
  netId: number;
  dmg: number;
}

export function parseHits(raw: unknown): { playerId: string; hits: SeqHit[] } | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const inner = r.payload && typeof r.payload === 'object'
    ? (r.payload as Record<string, unknown>)
    : r;
  const playerId = typeof inner.playerId === 'string' ? inner.playerId : '';
  if (!playerId || !Array.isArray(inner.hits)) return null;
  return { playerId, hits: inner.hits as SeqHit[] };
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
