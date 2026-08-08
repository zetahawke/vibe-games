import { GameSession } from './GameSession';
import {
  joinChannel,
  leaveChannel,
  broadcastPlayerTick,
  broadcastWaveTick,
  type PlayerTick,
} from '@/domain/online/realtimeChannel';
import { closeSession } from '@/domain/online/sessionService';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameSave } from '@/domain/save/save';

export class OnlineGameSession extends GameSession {
  private channel: RealtimeChannel | null = null;
  private readonly sessionId: string;
  private readonly playerId: string;
  private readonly sessionToken: string;
  private readonly isHost: boolean;
  private readonly playerCount: number;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private scoreRecorded = false;

  constructor(
    root: HTMLElement,
    username: string,
    sessionId: string,
    playerId: string,
    sessionToken: string,
    playerCount: number,
    isHost: boolean,
    onExitToHub: () => void,
  ) {
    super(root, username, 'new', onExitToHub);
    this.sessionId    = sessionId;
    this.playerId     = playerId;
    this.sessionToken = sessionToken;
    this.playerCount  = playerCount;
    this.isHost       = isHost;

    this.channel = joinChannel(
      sessionId,
      playerId,
      username,
      isHost,
      (tick: PlayerTick) => this.onRemotePlayerTick(tick),
      (tick) => { if (!this.isHost) this.applyRemoteWaveTick(tick); },
      () => this.handleHostLeft(),
    );

    this.tickInterval = setInterval(() => this.broadcastSelf(), 1000);
  }

  protected override beginWithSave(save: GameSave): void {
    super.beginWithSave(save);
    this.world?.setSpawnMultiplier(this.playerCount);
    this.world?.setEnemyHpMultiplier(1 + (this.playerCount - 1) * 0.2);
  }

  private broadcastSelf(): void {
    if (!this.channel || !this.save) return;
    broadcastPlayerTick(this.channel, {
      playerId:       this.playerId,
      name:           this.username,
      wave:           this.waves.wave,
      kills:          this.save.score,
      score:          this.save.score,
      coins:          this.save.coins,
      lives:          this.waves.lives,
      equippedWeapon: this.save.equippedWeapon,
    });
    if (this.isHost) {
      broadcastWaveTick(this.channel, { wave: this.waves.wave, phase: this.waves.phase });
    }
  }

  private onRemotePlayerTick(_tick: PlayerTick): void {
    // Future: render remote player avatars or co-op HUD entries.
  }

  private applyRemoteWaveTick(tick: { wave: number; phase: 'wave' | 'rest' }): void {
    this.waves = { ...this.waves, wave: tick.wave, phase: tick.phase };
  }

  // Called on non-host clients when the host's Presence entry disappears.
  // Records score first, then triggers hub redirect via dispose().
  private handleHostLeft(): void {
    void this.recordScore().finally(() => this.dispose());
  }

  override dispose(): void {
    if (this.tickInterval) { clearInterval(this.tickInterval); this.tickInterval = null; }
    if (this.channel) { leaveChannel(this.channel); this.channel = null; }
    if (this.isHost) {
      void this.recordScore();
      void closeSession(this.sessionId, this.playerId, this.sessionToken);
    }
    super.dispose();
  }

  private async recordScore(): Promise<void> {
    if (this.scoreRecorded || !this.save) return;
    this.scoreRecorded = true;
    await fetch('/api/scores/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId:     this.sessionId,
        playerId:      this.playerId,
        sessionToken:  this.sessionToken,
        personalScore: this.save.score,
        coinsEarned:   this.save.coins,
        lastWeapon:    this.save.equippedWeapon,
        subject:       this.save.subject,
        grade:         this.save.grade,
      }),
    });
  }
}
