import type { GameSubject, GradeLevel } from '@/domain/save/save';
import { isTouchPrimary } from '@/shared/device';
import { Phase } from '@/domain/save/save';
import { clear, el } from '@/shared/dom';

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
  readonly stickZone: HTMLElement;
  readonly lookZone: HTMLElement;
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

    this.stickZone = el('div', { className: 'hud-stick-zone', id: 'stick-zone' }, [
      el('div', { className: 'stick-base', id: 'stick-base' }, [
        el('div', { className: 'stick-knob', id: 'stick-knob' }),
      ]),
    ]);
    this.lookZone = el('div', { className: 'hud-look-zone', id: 'look-zone' });

    const cornerBtns = el('div', { className: 'hud-corner' }, [
      this.shopBtn,
      this.pauseBtn,
    ]);

    this.root.append(
      statsPanel,
      this.bannerEl,
      this.crosshairEl,
      cornerBtns,
    );

    if (this.touchMode) {
      this.root.append(
        this.stickZone,
        this.lookZone,
        this.fireBtn,
        this.jumpBtn,
      );
    } else {
      const hint = el('div', { className: 'hud-hint' }, [
        'WASD mover · Espacio saltar · Mouse mirar · Clic disparar · E tienda · Esc pausa',
      ]);
      this.root.append(hint);
      this.fireBtn.hidden = true;
      this.jumpBtn.hidden = true;
      this.stickZone.hidden = true;
      this.lookZone.hidden = true;
      this.root.append(this.fireBtn, this.jumpBtn, this.stickZone, this.lookZone);
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
  }

  dispose(): void {
    this.root.remove();
  }
}

// ── Level + Subject picker ────────────────────────────────────────────────────

export type SubjectChoice = { subject: 'math' } | { subject: 'english'; englishGrade: '7mo' };
export interface LevelSubjectChoice {
  grade: GradeLevel;
  subject: GameSubject;
  englishGrade: '7mo';
}

const GRADES: { id: GradeLevel; label: string; enabled: boolean }[] = [
  { id: '5to', label: '5to Básico', enabled: false },
  { id: '6to', label: '6to Básico', enabled: false },
  { id: '7mo', label: '7mo Básico', enabled: true },
  { id: '8vo', label: '8vo Básico', enabled: false },
];

const SUBJECTS: { id: GameSubject; label: string; icon: string }[] = [
  { id: 'math',    label: 'Matemáticas', icon: '🔢' },
  { id: 'english', label: 'Inglés',       icon: '🇺🇸' },
];

export function renderLevelPicker(
  root: HTMLElement,
  onPick: (choice: LevelSubjectChoice) => void,
  onCancel: () => void,
): void {
  clear(root);
  let selectedGrade: GradeLevel | null = null;

  const showSubjects = (grade: GradeLevel) => {
    selectedGrade = grade;
    clear(root);

    const list = el('div', { className: 'btn-col' });
    for (const s of SUBJECTS) {
      const b = el('button', { type: 'button', className: 'btn primary' }, [`${s.icon} ${s.label}`]);
      b.addEventListener('click', () =>
        onPick({ grade, subject: s.id, englishGrade: '7mo' }),
      );
      list.append(b);
    }
    const back = el('button', { type: 'button', className: 'btn ghost' }, ['← Volver']);
    back.addEventListener('click', () => showGrades());
    root.append(
      el('section', { className: 'screen' }, [
        el('h1', {}, ['Elige la materia']),
        el('p', { className: 'muted' }, [`Nivel: ${GRADES.find(g => g.id === grade)?.label}`]),
        list,
        back,
      ]),
    );
  };

  const showGrades = () => {
    selectedGrade = null;
    clear(root);
    const list = el('div', { className: 'btn-col' });
    for (const g of GRADES) {
      const b = el('button', {
        type: 'button',
        className: 'btn primary',
        ...(g.enabled ? {} : { disabled: 'true' }),
      }, [g.label + (g.enabled ? '' : ' — próximamente')]);
      if (g.enabled) b.addEventListener('click', () => showSubjects(g.id));
      list.append(b);
    }
    const cancel = el('button', { type: 'button', className: 'btn ghost topic-cancel' }, ['Cancelar']);
    cancel.addEventListener('click', onCancel);
    root.append(
      el('section', { className: 'screen' }, [
        el('h1', {}, ['Protege el fuerte']),
        el('p', { className: 'muted' }, ['Elige tu nivel']),
        list,
        cancel,
      ]),
    );
  };

  showGrades();
  void selectedGrade; // suppress unused warning
}
