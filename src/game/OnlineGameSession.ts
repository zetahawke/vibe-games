import { GameSession } from './GameSession';
import {
  joinChannel,
  leaveChannel,
  publishHits,
  publishPresence,
  publishStart,
  publishWorld,
  type NetPeer,
  type WorldNetTick,
  type ChannelStatus,
} from '@/domain/online/realtimeChannel';
import type { MatchStartPayload } from '@/domain/online/netParse';
import { takeNewHits, type SeqHit } from '@/domain/online/hitSeq';
import { closeSession, leaveSession } from '@/domain/online/sessionService';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { EnglishGrade } from '@/domain/english';
import { defaultSave, type GameSave, type GameSubject, type GradeLevel } from '@/domain/save/save';
import { clear, el } from '@/shared/dom';
import type { World } from '@/game/world/World';

let _onlineBoot = false;

export class OnlineGameSession extends GameSession {
  private channel: RealtimeChannel | null = null;
  private readonly sessionId: string;
  private readonly code: string;
  private readonly playerId: string;
  private readonly sessionToken: string;
  private readonly isHost: boolean;
  private playerCount: number;
  private publishInterval: ReturnType<typeof setInterval> | null = null;
  private scoreRecorded = false;
  private gameInitialized = false;
  private netStatus: ChannelStatus = 'connecting';

  private coopPanel: HTMLElement | null = null;
  private netBadge: HTMLElement | null = null;
  private peers = new Map<string, NetPeer>();
  private refreshLobbyList: (() => void) | null = null;
  private lastHitSeqByPlayer = new Map<string, number>();
  private localHitSeq = 0;
  private localHits: SeqHit[] = [];
  private lastStartSent = 0;

  constructor(
    root: HTMLElement,
    username: string,
    sessionId: string,
    code: string,
    playerId: string,
    sessionToken: string,
    playerCount: number,
    isHost: boolean,
    onExitToHub: () => void,
  ) {
    _onlineBoot = true;
    super(root, username, 'new', onExitToHub);
    _onlineBoot = false;

    this.sessionId    = sessionId;
    this.code         = code;
    this.playerId     = playerId;
    this.sessionToken = sessionToken;
    this.playerCount  = playerCount;
    this.isHost       = isHost;

    this.channel = joinChannel(code, playerId, username, isHost, {
      onPeers: (peers, status) => this.onPeers(peers, status),
      onStart: (start) => this.onStart(start),
      onWorld: (tick) => this.onWorld(tick),
      onHits: (tick) => this.onHits(tick),
      onHostLeft: () => this.handleHostLeft(),
    });

    this.publishInterval = setInterval(() => this.publish(), 100);

    if (isHost) this.showHostLobby();
    else this.showWaitingForHost();
  }

  protected override startOrPick(): void {
    if (_onlineBoot) return;
    super.startOrPick();
  }

  protected override shouldPersist(): boolean { return false; }
  protected override advancesWaveLocally(): boolean { return this.isHost; }

  private showHostLobby(): void {
    clear(this.wrap);
    const listEl = el('div', { className: 'btn-col' });
    const countEl = el('p', { className: 'muted' }, ['Jugadores: 1 / 4']);
    const statusEl = el('p', { className: 'muted' }, ['Conectando…']);
    const startBtn = el('button', { type: 'button', className: 'btn primary' }, ['▶ Comenzar']) as HTMLButtonElement;
    const cancelBtn = el('button', { type: 'button', className: 'btn ghost' }, ['Cancelar']) as HTMLButtonElement;

    const renderList = () => {
      this.playerCount = Math.max(1, this.peers.size);
      countEl.textContent = `Jugadores: ${this.playerCount} / 4`;
      statusEl.textContent = this.netStatus === 'online' ? '🟢 En línea' : this.netStatus === 'error' ? '🔴 Sin conexión' : '🟡 Conectando…';
      clear(listEl);
      for (const p of this.peers.values()) {
        listEl.append(el('p', {}, [p.is_host ? `${p.name} (anfitrión)` : p.name]));
      }
    };
    renderList();
    this.refreshLobbyList = renderList;

    startBtn.addEventListener('click', () => {
      this.playerCount = Math.max(1, this.peers.size);
      super.startOrPick();
    });
    cancelBtn.addEventListener('click', () => this.dispose());

    this.wrap.append(
      el('section', { className: 'screen' }, [
        el('h1', {}, ['Sala creada']),
        el('p', {}, ['Comparte este código con tus amigos:']),
        el('h2', { className: 'session-code' }, [this.code]),
        statusEl,
        countEl,
        listEl,
        el('div', { className: 'btn-col' }, [startBtn, cancelBtn]),
      ]),
    );
  }

  private showWaitingForHost(): void {
    clear(this.wrap);
    const cancel = el('button', { type: 'button', className: 'btn ghost' }, ['← Salir']) as HTMLButtonElement;
    cancel.addEventListener('click', () => this.dispose());
    const statusEl = el('p', { className: 'muted' }, ['Conectando…']);
    const listEl = el('div', { className: 'btn-col' });
    this.refreshLobbyList = () => {
      const net = this.netStatus === 'online' ? '🟢 En línea' : this.netStatus === 'error' ? '🔴 Sin conexión' : '🟡 Conectando…';
      statusEl.textContent = `${net} · código ${this.code}`;
      clear(listEl);
      if (this.peers.size === 0) {
        listEl.append(el('p', { className: 'muted' }, ['Nadie visible aún. El anfitrión debe tener este mismo código.']));
      }
      for (const p of this.peers.values()) {
        listEl.append(el('p', {}, [p.is_host ? `${p.name} (anfitrión)` : p.name]));
      }
    };
    this.refreshLobbyList();
    this.wrap.append(
      el('section', { className: 'screen' }, [
        el('h1', {}, ['Esperando al anfitrión…']),
        el('p', { className: 'muted' }, [
          'La partida comenzará automáticamente cuando el anfitrión inicie.',
        ]),
        el('h2', { className: 'session-code' }, [this.code]),
        statusEl,
        listEl,
        cancel,
      ]),
    );
  }

  protected override configureWorld(world: World): void {
    world.setGuestMode(!this.isHost);
    world.setSpawnMultiplier(this.playerCount);
    world.setEnemyHpMultiplier(1 + (this.playerCount - 1) * 0.2);
    world.setCombatNetHandlers({
      onHit: (netId, dmg) => {
        this.localHitSeq += 1;
        this.localHits.push({ seq: this.localHitSeq, netId, dmg });
        if (this.localHits.length > 20) this.localHits.shift();
      },
      onSpawn: () => undefined,
    });
  }

  protected override beginWithSave(save: GameSave): void {
    this.gameInitialized = true;
    super.beginWithSave(save);
    this.buildCoopPanel();
    if (this.isHost && this.channel) {
      this.lastStartSent = Date.now();
      publishStart(this.channel, {
        subject: save.subject,
        grade: save.grade,
        englishGrade: save.englishGrade,
        pathHalfW: save.pathHalfW,
      });
    }
    this.publish();
  }

  private buildCoopPanel(): void {
    if (this.coopPanel) return;
    this.coopPanel = el('div', { className: 'coop-panel' });
    this.netBadge = el('div', { className: 'coop-row' }, ['🟡 …']);
    this.wrap.append(this.coopPanel);
    this.renderCoopPanel();
  }

  private renderCoopPanel(): void {
    if (!this.coopPanel) return;
    clear(this.coopPanel);
    const badge = this.netStatus === 'online' ? '🟢 En línea' : this.netStatus === 'error' ? '🔴 Red' : '🟡 …';
    this.coopPanel.append(el('div', { className: 'coop-row' }, [badge]));
    for (const p of this.peers.values()) {
      const isSelf = p.playerId === this.playerId;
      this.coopPanel.append(el('div', { className: isSelf ? 'coop-row coop-self' : 'coop-row' }, [
        el('span', { className: 'coop-name' }, [p.name + (isSelf ? ' ✦' : '')]),
        el('span', { className: 'coop-stat' }, [`♥ ${p.lives}`]),
        el('span', { className: 'coop-stat' }, [`🪙 ${p.coins}`]),
        el('span', { className: 'coop-stat' }, [`⭐ ${p.score}`]),
      ]));
    }
  }

  override skipRest(): boolean {
    return super.skipRest();
  }

  override spendSkipCoin(): boolean {
    return super.spendSkipCoin();
  }

  private onPeers(peers: NetPeer[], status: ChannelStatus): void {
    this.netStatus = status;
    this.peers.clear();
    for (const p of peers) this.peers.set(p.playerId, p);
    this.refreshLobbyList?.();
    this.renderCoopPanel();

    if (!this.world) return;

    for (const p of peers) {
      if (p.playerId === this.playerId) continue;
      if (!p.started) {
        this.world.removeRemotePlayer(p.playerId);
        continue;
      }
      this.world.upsertRemotePlayer(p.playerId, p.x, p.z, p.rotY, p.weapon);
    }
  }

  private onStart(start: MatchStartPayload): void {
    if (this.isHost || this.gameInitialized) return;
    this.startAsGuest(start);
  }

  private onHits(tick: { playerId: string; hits: SeqHit[] }): void {
    if (!this.isHost || !this.world) return;
    const prev = this.lastHitSeqByPlayer.get(tick.playerId) ?? 0;
    const { hits, nextLast } = takeNewHits(tick.hits, prev);
    for (const hit of hits) this.world.applyRemoteHit(hit.netId, hit.dmg);
    this.lastHitSeqByPlayer.set(tick.playerId, nextLast);
  }

  private startAsGuest(start: MatchStartPayload): void {
    this.refreshLobbyList = null;
    clear(this.wrap);
    this.beginWithSave(
      defaultSave({
        subject:      start.subject as GameSubject,
        grade:        start.grade as GradeLevel,
        englishGrade: (start.englishGrade || '7th') as EnglishGrade,
        mathTopic:    'mixed',
        pathHalfW:    start.pathHalfW || undefined,
      }),
    );
  }

  private onWorld(tick: WorldNetTick): void {
    if (this.isHost) return;
    if (!this.world || !this.gameInitialized) return;
    this.world.applyEnemySnapshot(tick.enemies);
    const becameOver = tick.status === 'gameover' && this.waves.status !== 'gameover';
    this.waves = {
      ...this.waves,
      wave:            tick.wave,
      phase:           tick.phase,
      phaseTimeLeftMs: tick.phaseTimeLeftMs,
      lives:           tick.lives || this.waves.lives,
      status:          tick.status === 'gameover' ? 'gameover' : this.waves.status,
    };
    this.world.setWavePhase(tick.phase, tick.wave);
    if (becameOver) this.handleGameOver();
  }

  private handleHostLeft(): void {
    void this.recordScore().finally(() => this.dispose());
  }

  protected override handleGameOver(): void {
    if (this.publishInterval) { clearInterval(this.publishInterval); this.publishInterval = null; }
    void this.recordScore();
    super.handleGameOver();
  }

  private publish(): void {
    if (!this.channel) return;
    const pos = this.world?.player.position;
    publishPresence(this.channel, {
      playerId:        this.playerId,
      name:            this.username,
      is_host:         this.isHost,
      x:               pos?.x ?? 0,
      z:               pos?.z ?? 8,
      rotY:            this.world?.playerYaw ?? 0,
      weapon:          this.save?.equippedWeapon ?? 'knife',
      score:           this.save?.score ?? 0,
      lives:           this.waves?.lives ?? 3,
      coins:           this.save?.coins ?? 0,
      started:         this.gameInitialized,
    });
    if (!this.isHost && this.localHits.length > 0) {
      publishHits(this.channel, { playerId: this.playerId, hits: this.localHits });
    }
    if (this.isHost && this.gameInitialized && this.save) {
      const now = Date.now();
      if (now - this.lastStartSent >= 400) {
        this.lastStartSent = now;
        publishStart(this.channel, {
          subject: this.save.subject,
          grade: this.save.grade,
          englishGrade: this.save.englishGrade,
          pathHalfW: this.save.pathHalfW,
        });
      }
      publishWorld(this.channel, {
        started:         true,
        wave:            this.waves.wave,
        phase:           this.waves.phase,
        phaseTimeLeftMs: this.waves.phaseTimeLeftMs,
        status:          this.waves.status === 'gameover' ? 'gameover' : 'playing',
        lives:           this.waves.lives,
        subject:         this.save.subject,
        grade:           this.save.grade,
        englishGrade:    this.save.englishGrade,
        pathHalfW:       this.save.pathHalfW,
        enemies:         this.world?.getEnemySnapshot() ?? [],
      });
    }
  }

  override dispose(): void {
    if (this.publishInterval) { clearInterval(this.publishInterval); this.publishInterval = null; }
    if (this.channel)         { leaveChannel(this.channel); this.channel = null; }
    void this.recordScore();
    if (this.isHost) void closeSession(this.sessionId, this.playerId, this.sessionToken);
    else void leaveSession(this.sessionId, this.playerId, this.sessionToken);
    super.dispose();
  }

  private async recordScore(): Promise<void> {
    if (this.scoreRecorded) return;
    this.scoreRecorded = true;
    if (!this.save) return;
    await fetch('/api/scores/record', {
      method: 'POST',
      keepalive: true,
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
