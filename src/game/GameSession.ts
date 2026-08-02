import { COINS_PER_ZOMBIE } from '../config/gameConfig';
import { addCoins } from '../economy/economy';
import { InputManager } from '../input/InputManager';
import {
  clearSave,
  defaultSave,
  GameSave,
  getHighScore,
  loadSave,
  updateHighScore,
  writeSave,
} from '../save/save';
import { Hud, renderTopicPicker } from '../ui/hud';
import { renderGameOverOverlay } from '../ui/gameOverOverlay';
import { renderPauseOverlay } from '../ui/pauseOverlay';
import { renderQuizOverlay } from '../ui/quizOverlay';
import { renderShopOverlay } from '../ui/shopOverlay';
import { clear, el } from '../ui/dom';
import { onFortBreached, tickWave, WaveState } from '../waves/waveLogic';
import { getWeapon } from '../weapons/weapons';
import { World } from '../world/World';

export class GameSession {
  private wrap: HTMLElement;
  private world: World | null = null;
  private input: InputManager | null = null;
  private hud: Hud | null = null;
  private save!: GameSave;
  private waves!: WaveState;
  private username: string;
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

    renderTopicPicker(
      this.wrap,
      (topic) => {
        clear(this.wrap);
        this.beginWithSave(defaultSave(topic));
      },
      () => this.exit(),
    );
  }

  persist(): void {
    if (!this.waves) return;
    writeSave(this.username, this.syncSave());
  }

  private beginWithSave(save: GameSave): void {
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
    this.world.setWavePhase(this.waves.phase, this.waves.wave);
    this.showBanner(this.waves.phase === 'wave' ? `¡Oleada ${this.waves.wave}!` : 'Descanso');
    writeSave(this.username, this.save);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private wireHud(): void {
    const hud = this.hud!;
    const input = this.input!;

    hud.shopBtn.addEventListener('click', () => this.requestShop());
    hud.pauseBtn.addEventListener('click', () => this.togglePause());
    hud.fireBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      input.pressFire(true);
    });
    hud.fireBtn.addEventListener('pointerup', () => input.pressFire(false));
    hud.fireBtn.addEventListener('pointerleave', () => input.pressFire(false));

    this.bindStick(hud.stickZone);
    this.bindLook(hud.lookZone);
  }

  private bindStick(zone: HTMLElement): void {
    const knob = zone.querySelector('#stick-knob') as HTMLElement;
    let active = false;
    const center = () => {
      const r = zone.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, max: r.width / 2 };
    };
    const update = (clientX: number, clientY: number) => {
      const c = center();
      let dx = clientX - c.x;
      let dy = clientY - c.y;
      const len = Math.hypot(dx, dy) || 1;
      const max = c.max - 10;
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.input?.setTouchMove(dx / max, dy / max);
    };
    const end = () => {
      active = false;
      knob.style.transform = 'translate(0,0)';
      this.input?.setTouchMove(0, 0);
    };
    zone.addEventListener('pointerdown', (e) => {
      active = true;
      zone.setPointerCapture(e.pointerId);
      update(e.clientX, e.clientY);
    });
    zone.addEventListener('pointermove', (e) => {
      if (active) update(e.clientX, e.clientY);
    });
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
    const clearLast = () => {
      last = null;
    };
    zone.addEventListener('pointerup', clearLast);
    zone.addEventListener('pointercancel', clearLast);
  }

  private requestShop(): void {
    if (!this.waves || this.waves.status === 'gameover') return;
    if (this.shopOverlay || this.quizOverlay) return;
    if (!this.world?.isPlayerInFort()) {
      this.showBanner('Entra al fuerte para abrir la tienda');
      return;
    }
    this.uiBlocking = true;
    this.world.setPaused(true);
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
    if (!this.quizOverlay) {
      this.uiBlocking = false;
      this.world?.setPaused(this.paused);
    }
    this.persist();
  }

  private openQuiz(): void {
    this.shopOverlay?.remove();
    this.shopOverlay = null;
    this.quizOverlay = renderQuizOverlay(
      this.wrap,
      this.save.mathTopic,
      this.save.quizDifficulty,
      (coins, difficulty) => {
        this.save.coins = addCoins(this.save.coins, coins);
        this.save.quizDifficulty = difficulty;
        this.persist();
        this.quizOverlay?.remove();
        this.quizOverlay = null;
        this.requestShop();
      },
      (difficulty) => {
        this.save.quizDifficulty = difficulty;
        this.quizOverlay?.remove();
        this.quizOverlay = null;
        this.requestShop();
      },
    );
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
      () => this.exit(),
    );
  }

  private resume(): void {
    this.paused = false;
    this.world?.setPaused(this.uiBlocking);
    this.overlay?.remove();
    this.overlay = null;
  }

  private loop = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const input = this.input!.consume(this.uiBlocking || this.paused);

    if (input.pause) this.togglePause();
    if (input.shop) this.requestShop();

    const prevPhase = this.waves.phase;
    const prevWave = this.waves.wave;

    if (!this.paused && !this.uiBlocking && this.waves.status === 'playing') {
      this.waves = tickWave(this.waves, dt * 1000);
      if (this.waves.phase !== prevPhase || this.waves.wave !== prevWave) {
        this.world?.setWavePhase(this.waves.phase, this.waves.wave);
        if (this.waves.phase === 'rest') {
          this.showBanner('Descanso');
          this.persist();
        } else {
          this.showBanner(`¡Oleada ${this.waves.wave}!`);
        }
      }
    }

    const equipped = getWeapon(this.save.equippedWeapon);
    const events = this.world!.update(dt, input, equipped);

    if (events.kills > 0 && this.waves.status === 'playing') {
      this.save.coins = addCoins(this.save.coins, events.kills * COINS_PER_ZOMBIE);
    }

    if (events.fortBreached && this.waves.status === 'playing' && !this.paused && !this.uiBlocking) {
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
      highScore: Math.max(getHighScore(this.username), this.waves.wave),
      banner: this.banner,
    });

    this.raf = requestAnimationFrame(this.loop);
  };

  private handleGameOver(): void {
    cancelAnimationFrame(this.raf);
    const best = updateHighScore(this.username, this.waves.wave);
    clearSave(this.username);
    this.world?.setPaused(true);
    this.overlay = renderGameOverOverlay(this.wrap, this.waves.wave, best, () => this.exit());
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

  private exit(): void {
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
