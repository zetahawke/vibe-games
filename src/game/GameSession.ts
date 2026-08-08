import { COINS_PER_ZOMBIE, REST_DURATION_MS, WAVE_DURATION_MS } from '@/config/gameConfig';
import { addCoins } from '@/domain/economy/economy';
import { shouldAwardSkipCoin, canSkipWave, SKIP_COINS_MAX } from '@/domain/rewards/skipLogic';
import {
  quizCoinsForWave,
  shouldHealOnWave,
  streakBonusCoins,
  MAX_LIVES,
} from '@/domain/rewards/rewardLogic';
import { InputManager } from '@/game/input/InputManager';
import {
  clearSave,
  defaultSave,
  GameSave,
  getHighScore,
  loadSave,
  updateHighScore,
  writeSave,
} from '@/domain/save/save';
import { scoreForKill } from '@/domain/score';
import { Hud, renderLevelPicker, type LevelSubjectChoice } from '@/game/ui/hud';
import { renderGameOverOverlay } from '@/game/ui/overlays/gameOverOverlay';
import { renderPauseOverlay } from '@/game/ui/overlays/pauseOverlay';
import { renderQuizOverlay } from '@/game/ui/overlays/quizOverlay';
import { renderShopOverlay } from '@/game/ui/overlays/shopOverlay';
import { renderEnglishQuizOverlay } from '@/game/ui/overlays/englishQuizOverlay';
import { clear, el } from '@/shared/dom';
import { onFortBreached, tickWave, WaveState } from '@/domain/waves/waveLogic';
import { getWeapon } from '@/domain/weapons/weapons';
import { World } from '@/game/world/World';

export class GameSession {
  protected wrap: HTMLElement;
  protected world: World | null = null;
  private input: InputManager | null = null;
  private hud: Hud | null = null;
  protected save!: GameSave;
  protected waves!: WaveState;
  protected username: string;
  private raf = 0;
  private last = 0;
  private paused = false;
  private uiBlocking = false;
  private overlay: HTMLElement | null = null;
  private shopOverlay: HTMLElement | null = null;
  private quizOverlay: HTMLElement | null = null;
  private banner = '';
  private bannerUntil = 0;
  private onExitToHub: () => void;

  constructor(
    private root: HTMLElement,
    username: string,
    mode: 'new' | 'continue',
    onExitToHub: () => void,
  ) {
    this.username = username;
    this.onExitToHub = onExitToHub;
    this.wrap = el('div', { className: 'game-wrap' });
    clear(root);
    root.append(this.wrap);

    if (mode === 'continue') {
      const existing = loadSave(username);
      if (existing) {
        this.beginWithSave(existing);
        return;
      }
    }

    this.startOrPick();
  }

  /**
   * Shows the level/subject picker and starts the game on selection.
   * Overridable by subclasses (e.g. OnlineGameSession for guests).
   */
  protected startOrPick(): void {
    renderLevelPicker(
      this.wrap,
      (choice: LevelSubjectChoice) => {
        clear(this.wrap);
        this.beginWithSave(
          defaultSave({
            subject: choice.subject,
            grade: choice.grade,
            englishGrade: choice.englishGrade,
            mathTopic: 'mixed',
          }),
        );
      },
      () => this.dispose(),
    );
  }

  persist(): void {
    if (!this.shouldPersist() || !this.waves) return;
    writeSave(this.username, this.syncSave());
  }

  /** Offline sessions persist to localStorage; online co-op must not. */
  protected shouldPersist(): boolean {
    return true;
  }

  /** Host/solo advance the wave timer. Online guests follow the host tick. */
  protected advancesWaveLocally(): boolean {
    return true;
  }

  /** Hook after World exists, before the first animation frame. */
  protected configureWorld(_world: World): void {}

  protected beginWithSave(save: GameSave): void {
    this.save = save;
    this.waves = {
      wave: save.wave,
      phase: save.phase,
      phaseTimeLeftMs: save.phaseTimeLeftMs,
      lives: save.lives,
      status: 'playing',
    };

    const canvasHost = el('div', { className: 'canvas-host' });
    this.wrap.append(canvasHost);
    this.world = new World(canvasHost, save.pathHalfW);
    this.input = new InputManager(this.world.canvas);
    this.hud = new Hud(this.wrap);
    this.wireHud();
    this.configureWorld(this.world);
    this.world.setWavePhase(this.waves.phase, this.waves.wave);
    this.showBanner(this.waves.phase === 'wave' ? `¡Oleada ${this.waves.wave}!` : 'Descanso');
    if (this.shouldPersist()) writeSave(this.username, this.save);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private wireHud(): void {
    const hud = this.hud!;
    const input = this.input!;

    hud.shopBtn.addEventListener('click', () => this.requestShop());
    hud.pauseBtn.addEventListener('click', () => this.togglePause());
    hud.skipRestBtn.addEventListener('click', () => this.skipRest());
    hud.skipWaveBtn.addEventListener('click', () => this.spendSkipCoin());
    hud.fireBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      input.pressFire(true);
    });
    hud.fireBtn.addEventListener('pointerup', () => input.pressFire(false));
    hud.fireBtn.addEventListener('pointerleave', () => input.pressFire(false));
    hud.jumpBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      input.pressJump();
    });

    this.bindDynamicStick(hud.stickZone);
    this.bindLook(hud.lookZone);
  }

  private bindDynamicStick(zone: HTMLElement): void {
    const base = zone.querySelector('#stick-base') as HTMLElement;
    const knob = zone.querySelector('#stick-knob') as HTMLElement;
    let active = false;
    let originX = 0;
    let originY = 0;
    const RADIUS = 52;

    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      active = true;
      zone.setPointerCapture(e.pointerId);
      const rect = zone.getBoundingClientRect();
      originX = e.clientX - rect.left;
      originY = e.clientY - rect.top;
      base.style.left = `${originX}px`;
      base.style.top = `${originY}px`;
      base.style.display = 'block';
      knob.style.transform = 'translate(-50%, -50%)';
    });

    zone.addEventListener('pointermove', (e) => {
      if (!active) return;
      const rect = zone.getBoundingClientRect();
      let dx = (e.clientX - rect.left) - originX;
      let dy = (e.clientY - rect.top) - originY;
      const len = Math.hypot(dx, dy) || 1;
      if (len > RADIUS) {
        dx = (dx / len) * RADIUS;
        dy = (dy / len) * RADIUS;
      }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      this.input?.setTouchMove(dx / RADIUS, dy / RADIUS);
    });

    const end = () => {
      active = false;
      base.style.display = 'none';
      this.input?.setTouchMove(0, 0);
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  private bindLook(zone: HTMLElement): void {
    let last: { x: number; y: number } | null = null;
    zone.addEventListener('pointerdown', (e) => {
      last = { x: e.clientX, y: e.clientY };
      zone.setPointerCapture(e.pointerId);
    });
    zone.addEventListener('pointermove', (e) => {
      if (!last) return;
      this.input?.setTouchLook(e.clientX - last.x, e.clientY - last.y);
      last = { x: e.clientX, y: e.clientY };
    });
    const clearLast = () => { last = null; };
    zone.addEventListener('pointerup', clearLast);
    zone.addEventListener('pointercancel', clearLast);
  }

  private requestShop(): void {
    if (!this.waves || this.waves.status === 'gameover') return;
    if (this.shopOverlay || this.quizOverlay) return;
    if (!this.world?.isPlayerInFort()) {
      this.showBanner('Entra al fuerte para abrir el inventario');
      return;
    }
    this.uiBlocking = true;
    this.shopOverlay = renderShopOverlay(
      this.wrap,
      this.save,
      (save) => {
        this.save = save;
        this.persist();
      },
      () => this.openQuiz(),
      () => this.closeShop(),
    );
  }

  private closeShop(): void {
    this.shopOverlay?.remove();
    this.shopOverlay = null;
    if (!this.quizOverlay) this.uiBlocking = false;
    this.persist();
  }

  private openQuiz(): void {
    this.shopOverlay?.remove();
    this.shopOverlay = null;

    if (this.save.subject === 'english') {
      this.quizOverlay = renderEnglishQuizOverlay(
        this.wrap,
        this.save.englishGrade,
        (coins, score) => {
          const scaledCoins = quizCoinsForWave(coins, this.waves.wave);
          this.save.coins = addCoins(this.save.coins, scaledCoins);
          this.save.quizStreak += 1;
          const bonus = streakBonusCoins(this.save.coins, this.save.quizStreak);
          if (bonus > 0) {
            this.save.coins = addCoins(this.save.coins, bonus);
            this.showBanner(`🎉 ¡Racha! +${bonus} monedas`);
          }
          this.save.score += score;
          this.persist();
          this.quizOverlay?.remove();
          this.quizOverlay = null;
          this.requestShop();
        },
        () => {
          this.save.quizStreak = 0;
          this.persist();
          this.quizOverlay?.remove();
          this.quizOverlay = null;
          this.requestShop();
        },
      );
    } else {
      this.quizOverlay = renderQuizOverlay(
        this.wrap,
        this.save.mathTopic,
        this.save.quizDifficulty,
        (coins, score, finalDifficulty) => {
          const scaledCoins = quizCoinsForWave(coins, this.waves.wave);
          this.save.coins = addCoins(this.save.coins, scaledCoins);
          this.save.quizStreak += 1;
          const bonus = streakBonusCoins(this.save.coins, this.save.quizStreak);
          if (bonus > 0) {
            this.save.coins = addCoins(this.save.coins, bonus);
            this.showBanner(`🎉 ¡Racha! +${bonus} monedas`);
          }
          this.save.score += score;
          this.save.quizDifficulty = finalDifficulty;
          this.persist();
          this.quizOverlay?.remove();
          this.quizOverlay = null;
          this.requestShop();
        },
      );
    }
  }

  /** Skip the rest phase immediately (no cost). Returns false if ignored. */
  skipRest(): boolean {
    if (this.waves.phase !== 'rest' || this.waves.status !== 'playing' || this.paused || this.uiBlocking) return false;
    this.waves = {
      ...this.waves,
      phase: 'wave',
      wave: this.waves.wave + 1,
      phaseTimeLeftMs: WAVE_DURATION_MS,
    };
    this.world?.setWavePhase(this.waves.phase, this.waves.wave);
    this.showBanner(`¡Oleada ${this.waves.wave}!`);
    this.persist();
    return true;
  }

  /** Spend a skip coin to clear the current wave instantly. Returns false if ignored. */
  spendSkipCoin(): boolean {
    if (this.waves.phase !== 'wave' || this.waves.status !== 'playing' || this.paused || this.uiBlocking) return false;
    if (!canSkipWave(this.save.skipCoins)) return false;
    this.save.skipCoins -= 1;
    this.save.wavesCleared += 1;
    // Note: skip-coin award for multiples of 10 only fires on *natural* wave
    // completion (wave→rest transition), not here — prevents the coin from
    // being immediately refunded.
    this.waves = {
      ...this.waves,
      phase: 'rest',
      phaseTimeLeftMs: REST_DURATION_MS,
    };
    this.world?.setWavePhase(this.waves.phase, this.waves.wave);
    this.showBanner('Oleada saltada · Descanso');
    this.persist();
    return true;
  }

  private togglePause(): void {
    if (this.uiBlocking || this.waves.status === 'gameover') return;
    if (this.paused) this.resume();
    else this.pause();
  }

  private pause(): void {
    this.paused = true;
    this.world?.setPaused(true);
    this.persist();
    this.overlay = renderPauseOverlay(
      this.wrap,
      () => this.resume(),
      () => this.dispose(),
    );
  }

  private resume(): void {
    this.paused = false;
    this.world?.setPaused(false);
    this.overlay?.remove();
    this.overlay = null;
  }

  private loop = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const input = this.input!.consume(this.uiBlocking || this.paused);

    if (!this.uiBlocking && input.pause) this.togglePause();
    if (!this.uiBlocking && input.shop) this.requestShop();

    const prevPhase = this.waves.phase;
    const prevWave = this.waves.wave;

    if (!this.paused && this.waves.status === 'playing') {
      if (this.advancesWaveLocally()) {
        this.waves = tickWave(this.waves, dt * 1000);
      } else {
        // Display-only countdown — phase changes come from the host.
        this.waves = {
          ...this.waves,
          phaseTimeLeftMs: Math.max(0, this.waves.phaseTimeLeftMs - dt * 1000),
        };
      }
      if (this.waves.phase !== prevPhase || this.waves.wave !== prevWave) {
        this.world?.setWavePhase(this.waves.phase, this.waves.wave);
        if (this.waves.phase === 'rest') {
          if (prevPhase === 'wave') {
            // Wave naturally completed (not fort breach)
            this.save.wavesCleared += 1;
            const healed = shouldHealOnWave(this.save.wavesCleared) && this.waves.lives < MAX_LIVES;
            if (healed) {
              this.waves = { ...this.waves, lives: this.waves.lives + 1 };
            }
            if (shouldAwardSkipCoin(this.save.wavesCleared) && this.save.skipCoins < SKIP_COINS_MAX) {
              this.save.skipCoins = Math.min(SKIP_COINS_MAX, this.save.skipCoins + 1);
              const healMsg = healed ? ' · ❤️ +1 vida' : '';
              this.showBanner(`Descanso · +1 moneda de salto (${this.save.skipCoins}/${SKIP_COINS_MAX})${healMsg}`);
            } else if (healed) {
              this.showBanner('Descanso · ❤️ +1 vida');
            } else {
              this.showBanner('Descanso');
            }
          } else {
            this.showBanner('Descanso');
          }
          this.persist();
        } else {
          this.showBanner(`¡Oleada ${this.waves.wave}!`);
        }
      }
    }

    const equipped = getWeapon(this.save.equippedWeapon);
    const events = this.world!.update(
      dt,
      this.uiBlocking || this.paused
        ? { moveX: 0, moveZ: 0, lookDx: 0, lookDy: 0, fire: false, jump: false, shop: false, pause: false }
        : input,
      equipped,
    );

    if (events.kills > 0 && this.waves.status === 'playing') {
      this.save.coins = addCoins(this.save.coins, events.kills * COINS_PER_ZOMBIE);
      this.save.score += events.kills * scoreForKill(this.waves.wave);
    }

    if (events.fortBreached && this.waves.status === 'playing' && !this.paused) {
      this.waves = onFortBreached(this.waves);
      this.world?.setWavePhase(this.waves.phase, this.waves.wave);
      if (this.waves.status === 'gameover') {
        this.handleGameOver();
        return;
      }
      this.showBanner('¡El fuerte fue atacado! Descanso');
      this.persist();
    }

    if (now > this.bannerUntil) this.banner = '';

    this.hud?.update({
      coins: this.save.coins,
      lives: this.waves.lives,
      wave: this.waves.wave,
      phase: this.waves.phase,
      phaseTimeLeftMs: this.waves.phaseTimeLeftMs,
      weaponName: equipped.name,
      score: this.save.score,
      highScore: Math.max(getHighScore(this.username), this.save.score),
      banner: this.banner,
      showCrosshair: !equipped.isMelee && !this.uiBlocking && !this.paused,
      skipCoins: this.save.skipCoins,
      wavesCleared: this.save.wavesCleared,
    });

    this.raf = requestAnimationFrame(this.loop);
  };

  protected handleGameOver(): void {
    cancelAnimationFrame(this.raf);
    const best = updateHighScore(this.username, this.save.score);
    if (this.shouldPersist()) clearSave(this.username);
    this.world?.setPaused(true);
    this.overlay = renderGameOverOverlay(
      this.wrap,
      this.waves.wave,
      best,
      () => this.dispose(),
      this.save.score,
    );
  }

  private syncSave(): GameSave {
    this.save.wave = this.waves.wave;
    this.save.phase = this.waves.phase;
    this.save.phaseTimeLeftMs = this.waves.phaseTimeLeftMs;
    this.save.lives = this.waves.lives;
    return this.save;
  }

  private showBanner(text: string): void {
    this.banner = text;
    this.bannerUntil = performance.now() + 2200;
  }

  public dispose(): void {
    if (this.waves && this.waves.status === 'playing') this.persist();
    cancelAnimationFrame(this.raf);
    this.input?.dispose();
    this.world?.dispose();
    this.hud?.dispose();
    this.overlay?.remove();
    this.shopOverlay?.remove();
    this.quizOverlay?.remove();
    this.onExitToHub();
  }
}
