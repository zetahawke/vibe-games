import { describe, expect, it } from 'vitest';
import {
  combineNetPeers,
  mergePresencePeers,
  packMobs,
  parseClockTick,
  parseMatch,
  parseMatchStart,
  unpackMobs,
} from '@/domain/online/netParse';
import type { PeerState } from '@/domain/online/matchStore';

function peer(over: Partial<PeerState> & Pick<PeerState, 'playerId' | 'name'>): PeerState {
  return {
    is_host: false,
    x: 0,
    z: 8,
    rotY: 0,
    weapon: 'knife',
    score: 0,
    lives: 3,
    coins: 0,
    started: false,
    ...over,
  };
}

describe('parseMatchStart', () => {
  it('reads subject and grade', () => {
    expect(parseMatchStart({ subject: 'math', grade: '5th', pathHalfW: 3 })).toEqual({
      subject: 'math',
      grade: '5th',
      englishGrade: '7th',
      pathHalfW: 3,
    });
  });

  it('unwraps nested payload', () => {
    expect(parseMatchStart({ payload: { subject: 'english', grade: '7th' } })?.subject).toBe('english');
  });

  it('rejects missing grade', () => {
    expect(parseMatchStart({ subject: 'math', started: true })).toBeNull();
  });
});

describe('packMobs / unpackMobs', () => {
  it('round-trips compact tuples', () => {
    const mobs = unpackMobs(packMobs([
      { id: 3, type: 'big_zombie', x: 1.234, z: -8.91, hp: 40.4, hpMax: 50 },
    ]));
    expect(mobs).toEqual([
      { id: 3, type: 'big_zombie', x: 1.23, z: -8.91, hp: 40, hpMax: 50 },
    ]);
  });

  it('unwraps object wrapper required by Realtime', () => {
    expect(unpackMobs({ m: [[2, 0, 1, 4, 20, 20]] })).toEqual([
      { id: 2, type: 'zombie', x: 1, z: 4, hp: 20, hpMax: 20 },
    ]);
  });
});

describe('parseMatch', () => {
  it('parses compact match including subject and mobs', () => {
    const m = parseMatch({
      subject: 'math', grade: '5th', englishGrade: '7th', pathHalfW: 3,
      w: 2, p: 'r', t: 8000, s: 'p', l: 3,
      m: [[2, 0, 1, 4, 20, 20]],
    });
    expect(m?.wave).toBe(2);
    expect(m?.phase).toBe('rest');
    expect(m?.enemies).toEqual([{ id: 2, type: 'zombie', x: 1, z: 4, hp: 20, hpMax: 20 }]);
  });

  it('rejects match without grade', () => {
    expect(parseMatch({ subject: 'math', w: 1, p: 'w', t: 1000, s: 'p', l: 3, m: [] })).toBeNull();
  });
});

describe('parseClockTick', () => {
  it('reads compact clock', () => {
    expect(parseClockTick({ w: 2, p: 'rest', t: 8000, s: 'p', l: 3 })).toEqual({
      wave: 2,
      phase: 'rest',
      phaseTimeLeftMs: 8000,
      status: 'playing',
      lives: 3,
    });
  });

  it('does not treat missing timer as zero', () => {
    expect(parseClockTick({ wave: 1, phase: 'wave' })).toBeNull();
  });
});

describe('mergePresencePeers', () => {
  it('keeps started true if any meta has it', () => {
    const merged = mergePresencePeers([
      peer({ playerId: 'h', name: 'hija', is_host: true, started: true }),
      peer({ playerId: 'h', name: 'hija', is_host: true, started: false }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.started).toBe(true);
    expect(merged[0]?.is_host).toBe(true);
  });
});

describe('combineNetPeers', () => {
  it('lets hello start and pose override stale presence', () => {
    const merged = combineNetPeers(
      [peer({ playerId: 'g', name: 'hija', started: false, x: 0, z: 8 })],
      [peer({ playerId: 'g', name: 'hija', started: true, x: 4, z: -2 })],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.started).toBe(true);
    expect(merged[0]?.x).toBe(4);
    expect(merged[0]?.z).toBe(-2);
  });
});
