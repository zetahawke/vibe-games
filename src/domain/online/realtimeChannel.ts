import type { RealtimeChannel } from '@supabase/supabase-js';
import type { EnemyType } from '@/domain/waves/enemyConfig';
import { getSupabase } from '@/lib/supabase';
import type { SeqHit } from './hitSeq';
import { mergePresencePeers, parseMatchStart, type MatchStartPayload } from './netParse';

export interface EnemyNetState {
  id: number;
  type: EnemyType;
  x: number;
  z: number;
  hp: number;
  hpMax: number;
}

/** Slim presence — large payloads make other clients stop seeing you. */
export interface NetPeer {
  playerId: string;
  name: string;
  is_host: boolean;
  x: number;
  z: number;
  rotY: number;
  weapon: string;
  score: number;
  lives: number;
  coins: number;
  started: boolean;
}

export interface WorldNetTick {
  started: boolean;
  wave: number;
  phase: 'wave' | 'rest';
  phaseTimeLeftMs: number;
  status: 'playing' | 'gameover';
  lives: number;
  subject: string;
  grade: string;
  englishGrade: string;
  pathHalfW: number;
  enemies: EnemyNetState[];
}

export interface HitsNetTick {
  playerId: string;
  hits: SeqHit[];
}

export type ChannelStatus = 'connecting' | 'online' | 'error';

export interface ChannelHandlers {
  onPeers: (peers: NetPeer[], status: ChannelStatus) => void;
  onWorld: (tick: WorldNetTick) => void;
  onStart: (start: MatchStartPayload) => void;
  onHits: (tick: HitsNetTick) => void;
  onHostLeft: () => void;
}

export function normalizeRoomCode(code: string | number): string {
  return String(code).replace(/\D/g, '').padStart(4, '0').slice(-4);
}

function parsePeer(raw: unknown, fallbackId = ''): NetPeer | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const playerId = typeof r.playerId === 'string' ? r.playerId : fallbackId;
  const name = typeof r.name === 'string' ? r.name : '';
  if (!playerId || !name) return null;
  return {
    playerId,
    name,
    is_host: Boolean(r.is_host),
    x:               Number(r.x) || 0,
    z:               Number(r.z) || 8,
    rotY:            Number(r.rotY) || 0,
    weapon:          typeof r.weapon === 'string' ? r.weapon : 'knife',
    score:           Number(r.score) || 0,
    lives:           Number(r.lives) || 0,
    coins:           Number(r.coins) || 0,
    started:         Boolean(r.started),
  };
}

function parseWorldTick(raw: unknown): WorldNetTick | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const inner = r.payload && typeof r.payload === 'object' && !Array.isArray(r.payload)
    ? (r.payload as Record<string, unknown>)
    : r;
  return {
    started:         Boolean(inner.started),
    wave:            Number(inner.wave) || 1,
    phase:           inner.phase === 'rest' ? 'rest' : 'wave',
    phaseTimeLeftMs: Number(inner.phaseTimeLeftMs) || 0,
    status:          inner.status === 'gameover' ? 'gameover' : 'playing',
    lives:           Number(inner.lives) || 0,
    subject:         typeof inner.subject === 'string' ? inner.subject : '',
    grade:           typeof inner.grade === 'string' ? inner.grade : '',
    englishGrade:    typeof inner.englishGrade === 'string' ? inner.englishGrade : '7th',
    pathHalfW:       Number(inner.pathHalfW) || 0,
    enemies:         Array.isArray(inner.enemies) ? inner.enemies as EnemyNetState[] : [],
  };
}

function parseHits(raw: unknown): HitsNetTick | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const inner = r.payload && typeof r.payload === 'object'
    ? (r.payload as Record<string, unknown>)
    : r;
  const playerId = typeof inner.playerId === 'string' ? inner.playerId : '';
  if (!playerId || !Array.isArray(inner.hits)) return null;
  return { playerId, hits: inner.hits as SeqHit[] };
}

export function joinChannel(
  roomCode: string | number,
  playerId: string,
  name: string,
  isHost: boolean,
  handlers: ChannelHandlers,
): RealtimeChannel {
  const topic = `jdc-room-${normalizeRoomCode(roomCode)}`;
  const client = getSupabase();
  const channel = client.channel(topic, {
    config: {
      broadcast: { ack: false, self: false },
      presence: { key: playerId },
    },
  });

  const emitPeers = (status: ChannelStatus) => {
    const state = channel.presenceState();
    const peers: NetPeer[] = [];
    for (const [key, entries] of Object.entries(state)) {
      const list = Array.isArray(entries) ? entries : [entries];
      for (const entry of list) {
        const peer = parsePeer(entry, key);
        if (peer) peers.push(peer);
      }
    }
    handlers.onPeers(mergePresencePeers(peers), status);
  };

  channel
    .on('presence', { event: 'sync' }, () => emitPeers('online'))
    .on('presence', { event: 'join' }, () => emitPeers('online'))
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      if (!isHost) {
        const hostGone = (leftPresences as unknown as Array<{ is_host?: boolean }>).some((p) => p.is_host);
        if (hostGone) handlers.onHostLeft();
      }
      emitPeers('online');
    })
    .on('broadcast', { event: 'start' }, ({ payload }) => {
      const start = parseMatchStart(payload);
      if (start) handlers.onStart(start);
    })
    .on('broadcast', { event: 'world' }, ({ payload }) => {
      const tick = parseWorldTick(payload);
      if (!tick) return;
      const start = parseMatchStart(tick);
      if (start) handlers.onStart(start);
      handlers.onWorld(tick);
    })
    .on('broadcast', { event: 'hits' }, ({ payload }) => {
      const hits = parseHits(payload);
      if (hits) handlers.onHits(hits);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          playerId,
          name,
          is_host: isHost,
          started: false,
          x: 0,
          z: 8,
          rotY: 0,
          weapon: 'knife',
          score: 0,
          lives: 3,
          coins: 0,
        });
        emitPeers('online');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        handlers.onPeers([], 'error');
      }
    });

  return channel;
}

export function publishPresence(channel: RealtimeChannel, state: NetPeer): void {
  void channel.track({
    playerId: state.playerId,
    name: state.name,
    is_host: state.is_host,
    started: state.started,
    x: state.x,
    z: state.z,
    rotY: state.rotY,
    weapon: state.weapon,
    score: state.score,
    lives: state.lives,
    coins: state.coins,
  });
}

export function publishStart(channel: RealtimeChannel, start: MatchStartPayload): void {
  void channel.send({ type: 'broadcast', event: 'start', payload: start });
}

export function publishWorld(channel: RealtimeChannel, tick: WorldNetTick): void {
  void channel.send({ type: 'broadcast', event: 'world', payload: tick });
}

export function publishHits(channel: RealtimeChannel, tick: HitsNetTick): void {
  void channel.send({ type: 'broadcast', event: 'hits', payload: tick });
}

export function leaveChannel(channel: RealtimeChannel): void {
  void getSupabase().removeChannel(channel);
}
