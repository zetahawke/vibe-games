import { isTouchPrimary } from '@/shared/device';
import { Phase } from '@/domain/save/save';
import { el } from '@/shared/dom';

export interface HudModel {
  coins: number;
  lives: number;
  wave: number;
  phase: Phase;
  phaseTimeLeftMs: number;
  weaponName: string;
  score: number;
  highScore: number;
  banner: string;
  showCrosshair: boolean;
  skipCoins: number;
  wavesCleared: number;
}

function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export class Hud {
  readonly root: HTMLElement;
  private coinsEl: HTMLElement;
  private livesEl: HTMLElement;
  private waveEl: HTMLElement;
  private timerEl: HTMLElement;
  private weaponEl: HTMLElement;
  private scoreEl: HTMLElement;
  private bannerEl: HTMLElement;
  private phaseEl: HTMLElement;
  private crosshairEl: HTMLElement;
  readonly touchMode: boolean;

  readonly shopBtn: HTMLButtonElement;
  readonly pauseBtn: HTMLButtonElement;
  readonly fireBtn: HTMLButtonElement;
  readonly jumpBtn: HTMLButtonElement;
  readonly touchPad: HTMLElement;
  readonly stickBase: HTMLElement;
  readonly stickKnob: HTMLElement;
  readonly skipRestBtn: HTMLButtonElement;
  readonly skipWaveBtn: HTMLButtonElement;
  private readonly _hiscoreEl: HTMLElement;

  constructor(parent: HTMLElement) {
    this.touchMode = isTouchPrimary();
    this.root = el('div', {
      className: this.touchMode ? 'hud hud-touch' : 'hud hud-desktop',
    });

    this.coinsEl = el('div', { className: 'hud-stat' });
    this.livesEl = el('div', { className: 'hud-stat' });
    this.waveEl  = el('div', { className: 'hud-stat' });
    this.phaseEl = el('div', { className: 'hud-stat' });
    this.timerEl = el('div', { className: 'hud-stat' });
    this.weaponEl = el('div', { className: 'hud-stat' });
    this.scoreEl = el('div', { className: 'hud-stat' });
    const highScoreEl = el('div', { className: 'hud-stat hud-stat-muted', id: 'hud-hiscore' });
    this.bannerEl = el('div', { className: 'hud-banner' });
    this.crosshairEl = el('div', { className: 'crosshair', hidden: 'true' });

    const statsPanel = el('div', { className: 'hud-stats' }, [
      this.coinsEl,
      this.livesEl,
      this.waveEl,
      this.phaseEl,
      this.timerEl,
      this.weaponEl,
      this.scoreEl,
      highScoreEl,
    ]);
    this._hiscoreEl = highScoreEl;

    this.shopBtn = el('button', { type: 'button', className: 'hud-icon-btn', title: 'Inventario' }, [
      '🎒',
    ]) as HTMLButtonElement;
    this.pauseBtn = el('button', { type: 'button', className: 'hud-icon-btn', title: 'Pausa' }, [
      '⏸',
    ]) as HTMLButtonElement;

    this.fireBtn = el('button', { type: 'button', className: 'hud-fire-btn' }, [
      '🔴',
    ]) as HTMLButtonElement;
    this.jumpBtn = el('button', { type: 'button', className: 'hud-jump-btn' }, [
      '⬆',
    ]) as HTMLButtonElement;

    this.stickKnob = el('div', { className: 'stick-knob', id: 'stick-knob' });
    this.stickBase = el('div', { className: 'stick-base', id: 'stick-base' }, [this.stickKnob]);
    this.touchPad = el('div', { className: 'hud-touch-pad', id: 'touch-pad' }, [this.stickBase]);

    this.skipRestBtn = el('button', {
      type: 'button',
      className: 'hud-skip-btn',
      title: 'Saltar descanso',
      hidden: 'true',
    }, ['⏭ Saltar descanso']) as HTMLButtonElement;

    this.skipWaveBtn = el('button', {
      type: 'button',
      className: 'hud-skip-btn hud-skip-wave-btn',
      title: 'Saltar oleada (cuesta 1 moneda de salto)',
      hidden: 'true',
    }, ['⏭ Saltar oleada 🪙']) as HTMLButtonElement;

    const cornerBtns = el('div', { className: 'hud-corner' }, [
      this.shopBtn,
      this.pauseBtn,
    ]);

    this.root.append(
      statsPanel,
      this.bannerEl,
      this.crosshairEl,
      cornerBtns,
      this.skipRestBtn,
      this.skipWaveBtn,
    );

    if (this.touchMode) {
      this.root.append(this.touchPad, this.fireBtn, this.jumpBtn);
    } else {
      const hint = el('div', { className: 'hud-hint' }, [
        'WASD mover · Espacio saltar · Mouse mirar · Clic disparar · E tienda · Esc pausa',
      ]);
      this.root.append(hint);
      this.fireBtn.hidden = true;
      this.jumpBtn.hidden = true;
      this.touchPad.hidden = true;
      this.root.append(this.fireBtn, this.jumpBtn, this.touchPad);
    }

    parent.append(this.root);
  }

  update(model: HudModel): void {
    this.coinsEl.textContent = `🪙 ${model.coins}`;
    this.livesEl.textContent = `${'♥'.repeat(model.lives)}${'♡'.repeat(Math.max(0, 3 - model.lives))}`;
    this.waveEl.textContent = `Oleada ${model.wave}`;
    this.phaseEl.textContent = model.phase === 'wave' ? '⚔ Combate' : '💤 Descanso';
    this.timerEl.textContent = `⏱ ${formatTime(model.phaseTimeLeftMs)}`;
    this.weaponEl.textContent = `🔫 ${model.weaponName}`;
    this.scoreEl.textContent = `⭐ ${model.score}`;
    this._hiscoreEl.textContent = `🏆 ${model.highScore}`;
    this.bannerEl.textContent = model.banner;
    this.crosshairEl.hidden = !model.showCrosshair;

    // Skip rest button: only during rest phase
    this.skipRestBtn.hidden = model.phase !== 'rest';

    // Skip wave button: only during wave phase and if player has skip coins
    const canSkip = model.phase === 'wave' && model.skipCoins > 0;
    this.skipWaveBtn.hidden = !canSkip;
    if (canSkip) {
      this.skipWaveBtn.textContent = `⏭ Saltar oleada (${model.skipCoins}🪙)`;
    }
  }

  dispose(): void {
    this.root.remove();
  }
}
