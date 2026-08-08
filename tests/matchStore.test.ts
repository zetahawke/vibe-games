import { describe, expect, it } from 'vitest';
import { createMatchStore, type PeerState } from '@/domain/online/matchStore';

function peer(over: Partial<PeerState> & Pick<PeerState, 'playerId' | 'name'>): PeerState {
  return {
    is_host: false, started: false, x: 0, y: 0, z: 8, rotY: 0,
    weapon: 'knife', grounded: true, sex: 'boy', color: '#2f6fed',
    score: 0, lives: 3, coins: 0, ...over,
  };
}

describe('createMatchStore', () => {
  it('ORs started when the same peer updates', () => {
    const s = createMatchStore('me');
    s.applyPeer(peer({ playerId: 'g', name: 'hija', started: true, x: 1 }));
    s.applyPeer(peer({ playerId: 'g', name: 'hija', started: false, x: 4 }));
    expect(s.peers()).toHaveLength(1);
    expect(s.peers()[0]?.started).toBe(true);
    expect(s.peers()[0]?.x).toBe(4);
  });

  it('tells a guest to start from the first match with subject and grade', () => {
    const s = createMatchStore('g');
    expect(s.shouldGuestStart()).toBeNull();
    s.applyMatch({
      subject: 'math', grade: '5th', englishGrade: '7th', pathHalfW: 3,
      wave: 1, phase: 'rest', phaseTimeLeftMs: 8000, status: 'playing', lives: 3, enemies: [],
    });
    expect(s.shouldGuestStart()?.subject).toBe('math');
    s.markGuestStarted();
    expect(s.shouldGuestStart()).toBeNull();
  });

  it('returns only new hit seqs per player', () => {
    const s = createMatchStore('host');
    const first = s.takeHitsForHost('g', [{ seq: 1, netId: 9, dmg: 10 }, { seq: 2, netId: 9, dmg: 10 }]);
    expect(first.map((h) => h.seq)).toEqual([1, 2]);
    const again = s.takeHitsForHost('g', [{ seq: 2, netId: 9, dmg: 10 }, { seq: 3, netId: 8, dmg: 5 }]);
    expect(again.map((h) => h.seq)).toEqual([3]);
  });
});
