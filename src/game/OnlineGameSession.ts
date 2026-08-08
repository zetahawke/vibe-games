import { GameSession } from './GameSession';
import { connectRoom, type RoomBus, type RoomStatus } from '@/domain/online/roomBus';
import {
  createMatchStore,
  parsePeer,
  type MatchSnapshot,
  type PeerState,
} from '@/domain/online/matchStore';
import { packMobs, parseMatch, parseShot } from '@/domain/online/netParse';
import { netStatusLabel } from '@/domain/online/netStatus';
import { parseHits, type SeqHit } from '@/domain/online/hitSeq';
import { closeSession, leaveSession } from '@/domain/online/sessionService';
import type { EnglishGrade } from '@/domain/english';
import type { EnemyType } from '@/domain/waves/enemyConfig';
import { requireProfile } from '@/domain/profile/profile';
import { defaultSave, type GameSave, type GameSubject } from '@/domain/save/save';
import { clear, el } from '@/shared/dom';
import type { World } from '@/game/world/World';

let _onlineBoot = false;

export class OnlineGameSession extends GameSession {
  private bus: RoomBus | null = null;
  private readonly store: ReturnType<typeof createMatchStore>;
  private readonly sessionId: string;
  private readonly code: string;
  private readonly playerId: string;
  private readonly sessionToken: string;
  private readonly isHost: boolean;
  private playerCount: number;
  private publishInterval: ReturnType<typeof setInterval> | null = null;
  private scoreRecorded = false;
  private gameInitialized = false;
  private netStatus: RoomStatus = 'connecting';

  private coopPanel: HTMLElement | null = null;
  private refreshLobbyList: (() => void) | null = null;
  private localHitSeq = 0;
  private localHits: SeqHit[] = [];
  private lastPresenceSent = 0;
  private lastCoopPanelAt = 0;
  private disposed = false;

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
    this.store        = createMatchStore(playerId);

    void this.connectRealtime(username, isHost);

    if (isHost) this.showHostLobby();
    else this.showWaitingForHost();
  }

  private async connectRealtime(username: string, isHost: boolean): Promise<void> {
    try {
      const bus = await connectRoom({
        code: this.code,
        playerId: this.playerId,
        name: username,
        isHost,
      });
      if (this.disposed) {
        bus.leave();
        return;
      }
      this.bus = bus;
      this.netStatus = bus.status;
      bus.on('peer', (raw) => {
        const p = parsePeer(raw);
        if (!p) return;
        this.store.applyPeer(p);
        this.onStorePeers();
      });
      bus.on('match', (raw) => {
        const m = parseMatch(raw);
        if (!m) return;
        this.store.applyMatch(m);
        if (!this.isHost && !this.gameInitialized) {
          const start = this.store.shouldGuestStart();
          if (start) {
            this.store.markGuestStarted();
            this.startAsGuest(start);
          }
        }
        this.applyMatchToGuest(m);
      });
      bus.on('hit', (raw) => this.onHits(raw));
      bus.on('shot', (raw) => this.onShot(raw));
      bus.onPresenceLeave((left) => {
        if (!this.isHost && left.some((p) => p.is_host)) this.handleHostLeft();
      });
      this.publishInterval = setInterval(() => this.publish(), 200);
      const look = requireProfile(username);
      const hello: PeerState = {
        playerId: this.playerId,
        name: username,
        is_host: isHost,
        started: false,
        x: 0, y: 0, z: 8, rotY: 0,
        weapon: 'knife',
        grounded: true,
        sex: look.sex,
        color: look.color,
        score: 0, lives: 3, coins: 0,
      };
      this.store.applyPeer(hello);
      this.bus.send('peer', { ...hello });
      this.onStorePeers();
    } catch {
      this.netStatus = 'error';
      this.refreshLobbyList?.();
    }
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
      const peers = this.store.peers();
      this.playerCount = Math.max(1, peers.length);
      countEl.textContent = `Jugadores: ${this.playerCount} / 4`;
      statusEl.textContent = netStatusLabel(this.netStatus, this.code);
      clear(listEl);
      for (const p of peers) {
        listEl.append(el('p', {}, [p.is_host ? `${p.name} (anfitrión)` : p.name]));
      }
    };
    renderList();
    this.refreshLobbyList = renderList;

    startBtn.addEventListener('click', () => {
      this.playerCount = Math.max(1, this.store.peers().length);
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
      statusEl.textContent = netStatusLabel(this.netStatus, this.code);
      clear(listEl);
      const peers = this.store.peers();
      if (peers.length === 0) {
        listEl.append(el('p', { className: 'muted' }, ['Nadie visible aún. El anfitrión debe tener este mismo código.']));
      }
      for (const p of peers) {
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
    world.setShotHandler((origin, yaw, weapon) => {
      this.bus?.send('shot', {
        playerId: this.playerId,
        x: origin.x, y: origin.y, z: origin.z,
        yaw,
        weapon,
      });
    });
  }

  protected override beginWithSave(save: GameSave): void {
    this.gameInitialized = true;
    super.beginWithSave(save);
    this.buildCoopPanel();
    if (this.isHost && this.bus) {
      this.bus.sendBootstrap('match', this.matchPayload());
    }
    this.publish();
  }

  private matchPayload(): Record<string, unknown> {
    return {
      subject: this.save?.subject,
      grade: this.save?.grade,
      englishGrade: this.save?.englishGrade,
      pathHalfW: this.save?.pathHalfW,
      w: this.waves.wave,
      p: this.waves.phase === 'rest' ? 'r' : 'w',
      t: Math.round(this.waves.phaseTimeLeftMs),
      s: this.waves.status === 'gameover' ? 'g' : 'p',
      l: this.waves.lives,
      m: packMobs(this.world?.getEnemySnapshot() ?? []),
    };
  }

  private buildCoopPanel(): void {
    if (this.coopPanel) return;
    this.coopPanel = el('div', { className: 'coop-panel' });
    this.wrap.append(this.coopPanel);
    this.renderCoopPanel(true);
  }

  private renderCoopPanel(force = false): void {
    if (!this.coopPanel) return;
    const now = Date.now();
    if (!force && now - this.lastCoopPanelAt < 250) return;
    this.lastCoopPanelAt = now;
    clear(this.coopPanel);
    this.coopPanel.append(el('div', { className: 'coop-row' }, [netStatusLabel(this.netStatus, this.code)]));
    for (const p of this.store.peers()) {
      const isSelf = p.playerId === this.playerId;
      this.coopPanel.append(el('div', { className: isSelf ? 'coop-row coop-self' : 'coop-row' }, [
        el('span', { className: 'coop-name' }, [p.name + (isSelf ? ' ✦' : '')]),
        el('span', { className: 'coop-stat' }, [`♥ ${p.lives}`]),
        el('span', { className: 'coop-stat' }, [`🪙 ${p.coins}`]),
        el('span', { className: 'coop-stat' }, [`⭐ ${p.score}`]),
      ]));
    }
  }

  private onStorePeers(): void {
    this.refreshLobbyList?.();
    this.renderCoopPanel();
    if (!this.world) return;
    for (const p of this.store.peers()) {
      if (p.playerId === this.playerId) continue;
      if (!p.started && !this.gameInitialized) {
        this.world.removeRemotePlayer(p.playerId);
        continue;
      }
      this.world.upsertRemotePlayer(
        p.playerId, p.x, p.z, p.rotY, p.weapon, p.y, p.grounded,
        { sex: p.sex, color: p.color },
      );
    }
  }

  private onHits(raw: unknown): void {
    if (!this.isHost || !this.world) return;
    const tick = parseHits(raw);
    if (!tick) return;
    for (const hit of this.store.takeHitsForHost(tick.playerId, tick.hits)) {
      this.world.applyRemoteHit(hit.netId, hit.dmg);
    }
  }

  private onShot(raw: unknown): void {
    if (!this.world) return;
    const shot = parseShot(raw);
    if (!shot || shot.playerId === this.playerId) return;
    this.world.spawnRemoteShot(
      { x: shot.x, y: shot.y, z: shot.z },
      shot.yaw,
      shot.weapon,
    );
  }

  private startAsGuest(start: MatchSnapshot): void {
    this.refreshLobbyList = null;
    clear(this.wrap);
    const profile = requireProfile(this.username);
    this.beginWithSave(
      defaultSave({
        subject:      start.subject as GameSubject,
        grade:        profile.grade,
        englishGrade: (start.englishGrade || '7th') as EnglishGrade,
        mathTopic:    'mixed',
        pathHalfW:    start.pathHalfW || undefined,
      }),
    );
  }

  private applyMatchToGuest(tick: MatchSnapshot): void {
    if (this.isHost || !this.gameInitialized || !this.world) return;
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
    if (tick.phase !== 'rest') {
      this.world.applyEnemySnapshot(tick.enemies.map((e) => ({
        ...e,
        type: e.type as EnemyType,
      })));
    }
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
    if (!this.bus || this.netStatus !== 'online') return;
    const now = Date.now();
    const pos = this.world?.player.position;
    if (now - this.lastPresenceSent >= 200) {
      this.lastPresenceSent = now;
      const look = requireProfile(this.username);
      const self: PeerState = {
        playerId: this.playerId,
        name:     this.username,
        is_host:  this.isHost,
        started:  this.gameInitialized,
        x:        pos?.x ?? 0,
        y:        pos?.y ?? 0,
        z:        pos?.z ?? 8,
        rotY:     this.world?.playerYaw ?? 0,
        weapon:   this.save?.equippedWeapon ?? 'knife',
        grounded: this.world?.playerGrounded ?? true,
        sex:      look.sex,
        color:    look.color,
        score:    this.save?.score ?? 0,
        lives:    this.waves?.lives ?? 3,
        coins:    this.save?.coins ?? 0,
      };
      this.store.applyPeer(self);
      this.bus.send('peer', { ...self });
      this.onStorePeers();
    }
    if (!this.isHost && this.localHits.length > 0) {
      this.bus.send('hit', { playerId: this.playerId, hits: this.localHits });
    }
    if (this.isHost && this.gameInitialized && this.save) {
      this.bus.send('match', this.matchPayload());
    }
  }

  override dispose(): void {
    this.disposed = true;
    if (this.publishInterval) { clearInterval(this.publishInterval); this.publishInterval = null; }
    this.bus?.leave();
    this.bus = null;
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
