import type { RealtimeChannel } from '@supabase/supabase-js';
import { getRealtime } from '@/lib/supabase';

export type RoomEvent = 'peer' | 'match' | 'hit' | 'shot';
export type RoomStatus = 'connecting' | 'online' | 'error';

export interface RoomBus {
  readonly status: RoomStatus;
  send(event: RoomEvent, payload: Record<string, unknown>): void;
  sendBootstrap(event: 'match', payload: Record<string, unknown>): void;
  on(event: RoomEvent, handler: (payload: unknown) => void): void;
  onPresenceLeave(handler: (left: Array<{ is_host?: boolean; playerId?: string }>) => void): void;
  leave(): void;
}

export function normalizeRoomCode(code: string | number): string {
  return String(code).replace(/\D/g, '').padStart(4, '0').slice(-4);
}

export function matchingRealtimeChannels<T extends { topic: string }>(
  channels: T[],
  roomTopic: string,
): T[] {
  const want = roomTopic.startsWith('realtime:') ? roomTopic : `realtime:${roomTopic}`;
  return channels.filter((c) => c.topic === want);
}

type ChannelHttp = RealtimeChannel & {
  httpSend?: (event: string, payload: unknown) => Promise<unknown>;
};

export async function connectRoom(opts: {
  code: string | number;
  playerId: string;
  name: string;
  isHost: boolean;
}): Promise<RoomBus> {
  const topic = `jdc-room-${normalizeRoomCode(opts.code)}`;
  const client = getRealtime();
  for (const stale of matchingRealtimeChannels(client.getChannels(), topic)) {
    await client.removeChannel(stale);
  }

  const channel = client.channel(topic, {
    config: {
      broadcast: { ack: false, self: false },
      presence: { key: opts.playerId, enabled: true },
    },
  }) as ChannelHttp;

  const handlers: Record<RoomEvent, Array<(payload: unknown) => void>> = {
    peer: [],
    match: [],
    hit: [],
    shot: [],
  };
  const leaveHandlers: Array<(left: Array<{ is_host?: boolean; playerId?: string }>) => void> = [];

  let status: RoomStatus = 'connecting';
  let open = false;

  channel
    .on('broadcast', { event: 'peer' }, ({ payload }) => {
      for (const h of handlers.peer) h(payload);
    })
    .on('broadcast', { event: 'match' }, ({ payload }) => {
      for (const h of handlers.match) h(payload);
    })
    .on('broadcast', { event: 'hit' }, ({ payload }) => {
      for (const h of handlers.hit) h(payload);
    })
    .on('broadcast', { event: 'shot' }, ({ payload }) => {
      for (const h of handlers.shot) h(payload);
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const left = (leftPresences ?? []) as Array<{ is_host?: boolean; playerId?: string }>;
      for (const h of leaveHandlers) h(left);
    });

  await new Promise<void>((resolve, reject) => {
    channel.subscribe((subStatus) => {
      if (subStatus === 'SUBSCRIBED') {
        void channel.track({
          playerId: opts.playerId,
          name: opts.name,
          is_host: opts.isHost,
        }).then(() => {
          status = 'online';
          open = true;
          resolve();
        }, reject);
      } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
        status = 'error';
        reject(new Error(subStatus));
      }
    });
  });

  const bus: RoomBus = {
    get status() { return status; },
    send(event, payload) {
      if (!open || channel.state !== 'joined') return;
      void channel.send({ type: 'broadcast', event, payload });
    },
    sendBootstrap(event, payload) {
      if (typeof channel.httpSend === 'function') {
        void channel.httpSend(event, payload).catch(() => undefined);
      }
      this.send(event, payload);
    },
    on(event, handler) {
      handlers[event].push(handler);
    },
    onPresenceLeave(handler) {
      leaveHandlers.push(handler);
    },
    leave() {
      open = false;
      status = 'error';
      void client.removeChannel(channel);
    },
  };

  return bus;
}
