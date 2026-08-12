import { takeNewHits, type SeqHit } from './hitSeq';

export interface PeerState {
  playerId: string;
  name: string;
  is_host: boolean;
  started: boolean;
  x: number;
  y: number;
  z: number;
  rotY: number;
  weapon: string;
  grounded: boolean;
  sex: 'boy' | 'girl';
  color: string;
  hatId: string;
  shirtId: string;
  pantsId: string;
  score: number;
  lives: number;
  coins: number;
}

export interface MatchSnapshot {
  subject: string;
  grade: string;
  englishGrade: string;
  pathHalfW: number;
  wave: number;
  phase: 'wave' | 'rest';
  phaseTimeLeftMs: number;
  status: 'playing' | 'gameover';
  lives: number;
  enemies: Array<{ id: number; type: string; x: number; z: number; hp: number; hpMax: number }>;
}

export function parsePeer(raw: unknown, fallbackId = ''): PeerState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const playerId = typeof r.playerId === 'string' ? r.playerId : fallbackId;
  const name = typeof r.name === 'string' ? r.name : '';
  if (!playerId || !name) return null;
  return {
    playerId,
    name,
    is_host: Boolean(r.is_host),
    started: Boolean(r.started),
    x: Number(r.x) || 0,
    y: Number(r.y) || 0,
    z: Number(r.z) || 8,
    rotY: Number(r.rotY) || 0,
    weapon: typeof r.weapon === 'string' ? r.weapon : 'knife',
    grounded: r.grounded !== false,
    sex: r.sex === 'girl' ? 'girl' : 'boy',
    color: typeof r.color === 'string' ? r.color : '#2f6fed',
    hatId: typeof r.hatId === 'string' ? r.hatId : 'none',
    shirtId: typeof r.shirtId === 'string' ? r.shirtId : 'none',
    pantsId: typeof r.pantsId === 'string' ? r.pantsId : 'none',
    score: Number(r.score) || 0,
    lives: Number(r.lives) || 0,
    coins: Number(r.coins) || 0,
  };
}

export function createMatchStore(selfId: string) {
  void selfId;
  const byId = new Map<string, PeerState>();
  let lastMatch: MatchSnapshot | null = null;
  let guestStarted = false;
  const lastHitSeq = new Map<string, number>();

  return {
    applyPeer(peer: PeerState): void {
      const prev = byId.get(peer.playerId);
      if (!prev) {
        byId.set(peer.playerId, peer);
        return;
      }
      byId.set(peer.playerId, {
        ...prev,
        ...peer,
        started: prev.started || peer.started,
        is_host: prev.is_host || peer.is_host,
      });
    },

    applyMatch(match: MatchSnapshot): void {
      lastMatch = match;
    },

    peers(): PeerState[] {
      return [...byId.values()];
    },

    match(): MatchSnapshot | null {
      return lastMatch;
    },

    shouldGuestStart(): MatchSnapshot | null {
      if (guestStarted || !lastMatch?.subject || !lastMatch.grade) return null;
      return lastMatch;
    },

    markGuestStarted(): void {
      guestStarted = true;
    },

    takeHitsForHost(playerId: string, hits: SeqHit[]): SeqHit[] {
      const prev = lastHitSeq.get(playerId) ?? 0;
      const { hits: fresh, nextLast } = takeNewHits(hits, prev);
      lastHitSeq.set(playerId, nextLast);
      return fresh;
    },
  };
}
