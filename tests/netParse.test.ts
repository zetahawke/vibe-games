import { describe, expect, it } from 'vitest';
import { mergePresencePeers, parseMatchStart } from '@/domain/online/netParse';
import type { NetPeer } from '@/domain/online/realtimeChannel';

function peer(over: Partial<NetPeer> & Pick<NetPeer, 'playerId' | 'name'>): NetPeer {
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
