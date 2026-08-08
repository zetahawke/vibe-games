import type { EnemyType } from '@/domain/waves/enemyConfig';
import type { MatchSnapshot } from './matchStore';

export interface MatchStartPayload {
  subject: string;
  grade: string;
  englishGrade: string;
  pathHalfW: number;
}

export interface ClockNetTick {
  wave: number;
  phase: 'wave' | 'rest';
  phaseTimeLeftMs: number;
  status: 'playing' | 'gameover';
  lives: number;
}

export interface PackedMob {
  id: number;
  type: EnemyType;
  x: number;
  z: number;
  hp: number;
  hpMax: number;
}

const MOB_TYPES: EnemyType[] = ['zombie', 'big_zombie', 'monster', 'yeti'];

/** [id, typeIndex, x, z, hp, hpMax] */
export type MobTuple = [number, number, number, number, number, number];

export function packMobs(mobs: PackedMob[]): MobTuple[] {
  return mobs.map((m) => [
    m.id,
    Math.max(0, MOB_TYPES.indexOf(m.type)),
    Math.round(m.x * 100) / 100,
    Math.round(m.z * 100) / 100,
    Math.round(m.hp),
    Math.round(m.hpMax),
  ]);
}

export function unpackMobs(raw: unknown): PackedMob[] {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'm' in raw) {
    return unpackMobs((raw as { m: unknown }).m);
  }
  if (!Array.isArray(raw)) return [];
  const out: PackedMob[] = [];
  for (const row of raw) {
    if (Array.isArray(row) && row.length >= 6) {
      const ti = Math.max(0, Math.min(MOB_TYPES.length - 1, Number(row[1]) || 0));
      out.push({
        id: Number(row[0]),
        type: MOB_TYPES[ti] ?? 'zombie',
        x: Number(row[2]),
        z: Number(row[3]),
        hp: Number(row[4]),
        hpMax: Number(row[5]),
      });
      continue;
    }
    if (row && typeof row === 'object' && 'id' in row) {
      const o = row as Record<string, unknown>;
      const type = typeof o.type === 'string' && MOB_TYPES.includes(o.type as EnemyType)
        ? (o.type as EnemyType)
        : 'zombie';
      out.push({
        id: Number(o.id),
        type,
        x: Number(o.x),
        z: Number(o.z),
        hp: Number(o.hp),
        hpMax: Number(o.hpMax) || Number(o.hp),
      });
    }
  }
  return out.filter((m) => Number.isFinite(m.id) && m.id > 0);
}

export function parseClockTick(raw: unknown): ClockNetTick | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const inner = r.payload && typeof r.payload === 'object' && !Array.isArray(r.payload)
    ? (r.payload as Record<string, unknown>)
    : r;
  const ms = inner.t ?? inner.phaseTimeLeftMs;
  if (ms === undefined || ms === null) return null;
  const phaseRaw = inner.p ?? inner.phase;
  const statusRaw = inner.s ?? inner.status;
  return {
    wave: Number(inner.w ?? inner.wave) || 1,
    phase: phaseRaw === 'rest' || phaseRaw === 'r' ? 'rest' : 'wave',
    phaseTimeLeftMs: Number(ms),
    status: statusRaw === 'gameover' || statusRaw === 'g' ? 'gameover' : 'playing',
    lives: Number(inner.l ?? inner.lives) || 0,
  };
}

type PresenceRow = { playerId: string; started: boolean; is_host: boolean };

export function parseMatch(raw: unknown): MatchSnapshot | null {
  const start = parseMatchStart(raw);
  const clock = parseClockTick(raw);
  if (!start || !clock) return null;
  return {
    ...start,
    wave: clock.wave,
    phase: clock.phase,
    phaseTimeLeftMs: clock.phaseTimeLeftMs,
    status: clock.status,
    lives: clock.lives,
    enemies: unpackMobs(raw),
  };
}

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

/** Presence first, then hello — hello pose wins, started/host flags OR. */
export function combineNetPeers<T extends PresenceRow>(presence: T[], hellos: T[]): T[] {
  return mergePresencePeers([...presence, ...hellos]);
}
