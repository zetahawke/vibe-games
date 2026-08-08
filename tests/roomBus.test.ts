import { beforeEach, describe, expect, it, vi } from 'vitest';

const sends: unknown[] = [];

const ch = {
  topic: 'realtime:jdc-room-0012',
  state: 'joining' as string,
  send: vi.fn(async (args: unknown) => { sends.push(args); }),
  httpSend: vi.fn(async () => ({ success: true as const })),
  on: vi.fn(function (this: unknown) { return this; }),
  subscribe: vi.fn((cb: (s: string) => void) => {
    ch.state = 'joined';
    cb('SUBSCRIBED');
    return ch;
  }),
  track: vi.fn(async () => 'ok'),
};

const other = { topic: 'realtime:jdc-room-0001' };
const removeChannel = vi.fn(async (c: { topic: string }) => {
  if (c === ch) ch.state = 'closed';
  return 'ok';
});

vi.mock('@/lib/supabase', () => ({
  getRealtime: () => ({
    channel: () => ch,
    getChannels: () => [ch, other],
    removeChannel,
  }),
}));

import { connectRoom, matchingRealtimeChannels } from '@/domain/online/roomBus';

describe('matchingRealtimeChannels', () => {
  it('only selects the same room topic', () => {
    expect(matchingRealtimeChannels(
      [{ topic: 'realtime:jdc-room-9902' }, { topic: 'realtime:jdc-room-0001' }],
      'jdc-room-9902',
    )).toEqual([{ topic: 'realtime:jdc-room-9902' }]);
  });
});

describe('connectRoom', () => {
  beforeEach(() => {
    sends.length = 0;
    ch.state = 'joining';
    ch.send.mockClear();
    ch.httpSend.mockClear();
    ch.on.mockClear();
    ch.subscribe.mockClear();
    ch.track.mockClear();
    removeChannel.mockClear();
  });

  it('does not send before the channel is joined, then sends broadcast after', async () => {
    const bus = await connectRoom({ code: '12', playerId: 'p1', name: 'papa', isHost: true });
    expect(ch.state).toBe('joined');
    bus.send('peer', { playerId: 'p1', name: 'papa' });
    expect(ch.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'peer',
      payload: { playerId: 'p1', name: 'papa' },
    });
  });

  it('drops send while not joined', async () => {
    const bus = await connectRoom({ code: '12', playerId: 'p1', name: 'papa', isHost: true });
    ch.send.mockClear();
    bus.leave();
    bus.send('peer', { playerId: 'p1', name: 'papa' });
    expect(ch.send).not.toHaveBeenCalled();
  });
});
