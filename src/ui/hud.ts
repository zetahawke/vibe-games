import { isTouchPrimary } from '../input/device';
import { Phase } from '../save/save';
import { clear, el } from './dom';

export interface HudModel {
  coins: number;
  lives: number;
  wave: number;
  phase: Phase;
  phaseTimeLeftMs: number;
  weaponName: string;
  highScore: number;
  banner: string;
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
  readonly touchMode: boolean;

  readonly shopBtn: HTMLButtonElement;
  readonly pauseBtn: HTMLButtonElement;
  readonly fireBtn: HTMLButtonElement;
  readonly stickZone: HTMLElement;
  readonly lookZone: HTMLElement;

  constructor(parent: HTMLElement) {
    this.touchMode = isTouchPrimary();
    this.root = el('div', {
      className: this.touchMode ? 'hud hud-touch' : 'hud hud-desktop',
    });
    this.coinsEl = el('div', { className: 'hud-item' });
    this.livesEl = el('div', { className: 'hud-item' });
    this.waveEl = el('div', { className: 'hud-item' });
    this.timerEl = el('div', { className: 'hud-item' });
    this.weaponEl = el('div', { className: 'hud-item' });
    this.scoreEl = el('div', { className: 'hud-item' });
    this.phaseEl = el('div', { className: 'hud-item' });
    this.bannerEl = el('div', { className: 'hud-banner' });

    this.shopBtn = el('button', { type: 'button', className: 'btn touch-btn' }, [
      'Tienda',
    ]) as HTMLButtonElement;
    this.pauseBtn = el('button', { type: 'button', className: 'btn touch-btn' }, [
      'Pausa',
    ]) as HTMLButtonElement;
    this.fireBtn = el('button', { type: 'button', className: 'btn touch-btn fire-btn' }, [
      'Disparar',
    ]) as HTMLButtonElement;
    this.stickZone = el('div', { className: 'stick-zone', id: 'stick-zone' }, [
      el('div', { className: 'stick-knob', id: 'stick-knob' }),
    ]);
    this.lookZone = el('div', { className: 'look-zone', id: 'look-zone' });

    const hint = this.touchMode
      ? null
      : el('div', { className: 'hud-hint' }, [
          'WASD mover · Mouse mirar · Clic disparar · E tienda · Esc pausa',
        ]);

    this.root.append(
      el('div', { className: 'hud-top' }, [
        this.coinsEl,
        this.livesEl,
        this.waveEl,
        this.phaseEl,
        this.timerEl,
        this.weaponEl,
        this.scoreEl,
      ]),
      this.bannerEl,
    );

    if (this.touchMode) {
      this.root.append(
        el('div', { className: 'hud-bottom' }, [
          this.stickZone,
          el('div', { className: 'hud-actions' }, [this.shopBtn, this.pauseBtn, this.fireBtn]),
          this.lookZone,
        ]),
      );
    } else {
      this.root.append(
        el('div', { className: 'hud-desktop-actions' }, [this.shopBtn, this.pauseBtn]),
      );
      if (hint) this.root.append(hint);
      // Keep nodes for GameSession wiring, but hidden
      this.fireBtn.hidden = true;
      this.stickZone.hidden = true;
      this.lookZone.hidden = true;
      this.root.append(this.fireBtn, this.stickZone, this.lookZone);
    }

    parent.append(this.root);
  }

  update(model: HudModel): void {
    this.coinsEl.textContent = `Monedas: ${model.coins}`;
    this.livesEl.textContent = `Vidas: ${'♥'.repeat(model.lives)}${'♡'.repeat(Math.max(0, 3 - model.lives))}`;
    this.waveEl.textContent = `Oleada: ${model.wave}`;
    this.phaseEl.textContent = model.phase === 'wave' ? 'Combate' : 'Descanso';
    this.timerEl.textContent = formatTime(model.phaseTimeLeftMs);
    this.weaponEl.textContent = `Arma: ${model.weaponName}`;
    this.scoreEl.textContent = `Récord: ${model.highScore}`;
    this.bannerEl.textContent = model.banner;
  }

  dispose(): void {
    this.root.remove();
  }
}

export function renderTopicPicker(
  root: HTMLElement,
  onPick: (topic: import('../config/gameConfig').MathTopic) => void,
  onCancel: () => void,
): void {
  clear(root);
  const topics: { id: import('../config/gameConfig').MathTopic; label: string }[] = [
    { id: 'sumas', label: 'Sumas' },
    { id: 'restas', label: 'Restas' },
    { id: 'multiplicaciones', label: 'Multiplicaciones' },
    { id: 'divisiones', label: 'Divisiones fáciles' },
    { id: 'mixto', label: 'Mixto' },
  ];
  const list = el('div', { className: 'btn-col' });
  for (const t of topics) {
    const b = el('button', { type: 'button', className: 'btn primary' }, [t.label]);
    b.addEventListener('click', () => onPick(t.id));
    list.append(b);
  }
  const cancel = el('button', { type: 'button', className: 'btn' }, ['Cancelar']);
  cancel.addEventListener('click', onCancel);
  root.append(
    el('section', { className: 'screen' }, [
      el('h1', {}, ['Elige el tema de mates']),
      list,
      cancel,
    ]),
  );
}
