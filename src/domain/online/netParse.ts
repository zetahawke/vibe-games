export interface MatchStartPayload {
  subject: string;
  grade: string;
  englishGrade: string;
  pathHalfW: number;
}

type PresenceRow = { playerId: string; started: boolean; is_host: boolean };

export function parseMatchStart(raw: unknown): MatchStartPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const inner = r.payload && typeof r.payload === 'object'
    ? (r.payload as Record<string, unknown>)
    : r;
  const subject = typeof inner.subject === 'string' ? inner.subject : '';
  const grade = typeof inner.grade === 'string' ? inner.grade : '';
  if (!subject || !grade) return null;
  return {
    subject,
    grade,
    englishGrade: typeof inner.englishGrade === 'string' && inner.englishGrade
      ? inner.englishGrade
      : '7th',
    pathHalfW: Number(inner.pathHalfW) || 0,
  };
}

/** One row per player; OR started/is_host so a stale meta cannot hide a start. */
export function mergePresencePeers<T extends PresenceRow>(peers: T[]): T[] {
  const byId = new Map<string, T>();
  for (const p of peers) {
    const prev = byId.get(p.playerId);
    if (!prev) {
      byId.set(p.playerId, p);
      continue;
    }
    byId.set(p.playerId, {
      ...prev,
      ...p,
      started: prev.started || p.started,
      is_host: prev.is_host || p.is_host,
    });
  }
  return [...byId.values()];
}
