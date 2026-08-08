import type { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

export interface PlayerTick {
  playerId: string;
  name: string;
  wave: number;
  kills: number;
  score: number;
  coins: number;
  lives: number;
  equippedWeapon: string;
}

export interface WaveTick {
  wave: number;
  phase: 'wave' | 'rest';
}

interface PresenceState {
  playerId: string;
  name: string;
  is_host: boolean;
}

export function joinChannel(
  sessionId: string,
  playerId: string,
  name: string,
  isHost: boolean,
  onPlayerTick: (tick: PlayerTick) => void,
  onWaveTick: (tick: WaveTick) => void,
  onHostLeft: () => void,
): RealtimeChannel {
  const channel = getSupabase().channel(`session:${sessionId}`, {
    config: { presence: { key: playerId } },
  });

  channel
    .on('broadcast', { event: 'player_tick' }, ({ payload }) => {
      if ((payload as PlayerTick).playerId !== playerId) {
        onPlayerTick(payload as PlayerTick);
      }
    })
    .on('broadcast', { event: 'wave_tick' }, ({ payload }) => {
      onWaveTick(payload as WaveTick);
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      // Non-host clients: if the host's presence entry leaves, end session immediately.
      if (!isHost) {
        const hostDeparted = (leftPresences as unknown as PresenceState[]).some((p) => p.is_host);
        if (hostDeparted) onHostLeft();
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ playerId, name, is_host: isHost });
      }
    });

  return channel;
}

export function broadcastPlayerTick(channel: RealtimeChannel, tick: PlayerTick): void {
  void channel.send({ type: 'broadcast', event: 'player_tick', payload: tick });
}

export function broadcastWaveTick(channel: RealtimeChannel, tick: WaveTick): void {
  void channel.send({ type: 'broadcast', event: 'wave_tick', payload: tick });
}

export function leaveChannel(channel: RealtimeChannel): void {
  void channel.unsubscribe();
}
