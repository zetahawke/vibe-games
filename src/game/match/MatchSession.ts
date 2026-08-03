import { resolveDrop, type DropMode } from '@/domain/animals/dropRules';
import { clear, el } from '@/shared/dom';
import type { MatchItem, MatchSessionOptions } from './types';

function playTone(freq: number, durationMs: number, type: OscillatorType = 'sine'): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.stop(ctx.currentTime + durationMs / 1000);
    osc.onended = () => void ctx.close();
  } catch {
    /* audio optional */
  }
}

function playSoftFail(): void {
  playTone(180, 180, 'triangle');
}

function playSuccessPing(): void {
  playTone(520, 120, 'sine');
  setTimeout(() => playTone(720, 140, 'sine'), 90);
}

function shuffleItems<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

export class MatchSession {
  private root: HTMLElement;
  private screen: HTMLElement;
  private shadowsRow: HTMLElement;
  private piecesRow: HTMLElement;
  private celebrate: HTMLElement | null = null;
  private round: MatchItem[] = [];
  private placed = new Set<string>();
  private disposed = false;
  private readonly dropMode: DropMode;
  private readonly pickRound: () => MatchItem[];
  private readonly renderArt: MatchSessionOptions['renderArt'];
  private readonly onPick?: (item: MatchItem) => void;
  private readonly onSuccess?: (item: MatchItem) => void;
  private readonly onExit: () => void;
  private readonly celebrateMessage: string;

  constructor(options: MatchSessionOptions) {
    this.root = options.root;
    this.dropMode = options.dropMode;
    this.pickRound = options.pickRound;
    this.renderArt = options.renderArt;
    this.onPick = options.onPick;
    this.onSuccess = options.onSuccess;
    this.onExit = options.onExit;
    this.celebrateMessage = options.celebrateMessage;

    clear(options.root);
    this.screen = el('section', { className: `match-screen ${options.screenClassName}` });
    const header = el('header', { className: 'match-header' }, [el('h1', {}, [options.title])]);
    const exitBtn = el('button', { type: 'button', className: 'btn ghost match-exit' }, [
      'Salir',
    ]) as HTMLButtonElement;
    exitBtn.addEventListener('click', () => this.leave());
    header.append(exitBtn);

    this.shadowsRow = el('div', { className: 'match-shadows-row', 'aria-label': 'Sombras' });
    this.piecesRow = el('div', { className: 'match-pieces-row', 'aria-label': 'Piezas' });
    this.screen.append(header, this.shadowsRow, this.piecesRow);
    options.root.append(this.screen);
    this.startRound();
  }

  dispose(): void {
    this.disposed = true;
    clear(this.root);
  }

  private leave(): void {
    this.dispose();
    this.onExit();
  }

  private startRound(): void {
    this.celebrate?.remove();
    this.celebrate = null;
    this.placed.clear();
    clear(this.shadowsRow);
    clear(this.piecesRow);
    this.round = this.pickRound();
    const pieceOrder = shuffleItems([...this.round]);

    for (const item of this.round) {
      const shadow = el('div', {
        className: 'match-shadow',
        'data-shadow-id': item.id,
        title: item.label,
      });
      const shadowArtSpec = this.renderArt(item, 'shadow');
      const shadowArt = el('div', { className: shadowArtSpec.className });
      shadowArt.innerHTML = shadowArtSpec.html;
      shadow.append(shadowArt, el('span', { className: 'match-label' }, [item.label]));
      this.shadowsRow.append(shadow);
    }

    for (const item of pieceOrder) {
      const piece = el('button', {
        type: 'button',
        className: 'match-piece',
        'data-piece-id': item.id,
        'aria-label': item.label,
      }) as HTMLButtonElement;
      const pieceArtSpec = this.renderArt(item, 'color');
      const pieceArt = el('div', { className: pieceArtSpec.className });
      pieceArt.innerHTML = pieceArtSpec.html;
      piece.append(pieceArt, el('span', { className: 'match-label' }, [item.label]));
      this.piecesRow.append(piece);
      this.bindDrag(piece, item);
    }
  }

  private bindDrag(piece: HTMLElement, item: MatchItem): void {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onDown = (e: PointerEvent) => {
      if (this.placed.has(item.id) || this.disposed) return;
      e.preventDefault();
      dragging = true;
      this.onPick?.(item);
      piece.setPointerCapture(e.pointerId);
      piece.classList.add('dragging');
      const r = piece.getBoundingClientRect();
      offsetX = e.clientX - r.left;
      offsetY = e.clientY - r.top;
      piece.style.position = 'fixed';
      piece.style.left = `${r.left}px`;
      piece.style.top = `${r.top}px`;
      piece.style.width = `${r.width}px`;
      piece.style.height = `${r.height}px`;
      piece.style.zIndex = '20';
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      piece.style.left = `${e.clientX - offsetX}px`;
      piece.style.top = `${e.clientY - offsetY}px`;
    };

    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      piece.classList.remove('dragging');
      try {
        piece.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      piece.style.visibility = 'hidden';
      const under = document.elementFromPoint(e.clientX, e.clientY);
      piece.style.visibility = '';

      const shadowEl = under?.closest?.('[data-shadow-id]') as HTMLElement | null;
      const targetId = shadowEl?.dataset.shadowId ?? null;
      const filled = shadowEl?.hasAttribute('data-filled') ?? false;
      const effectiveTarget = filled ? null : targetId;

      const result = resolveDrop(this.dropMode, item.id, effectiveTarget);
      if (result.accept && shadowEl) {
        playSuccessPing();
        this.placed.add(item.id);
        shadowEl.setAttribute('data-filled', 'true');
        shadowEl.classList.add('filled');
        piece.style.position = '';
        piece.style.left = '';
        piece.style.top = '';
        piece.style.width = '';
        piece.style.height = '';
        piece.style.zIndex = '';
        const art = shadowEl.querySelector('.match-art, .animal-art, .identify-art');
        if (art) {
          const color = this.renderArt(item, 'color');
          art.className = color.className;
          art.innerHTML = color.html;
        }
        this.onSuccess?.(item);
        piece.remove();
        if (this.placed.size === this.round.length) this.showCelebrate();
        return;
      }

      if (result.feedback === 'softFail') {
        playSoftFail();
        piece.classList.add('shake');
        window.setTimeout(() => piece.classList.remove('shake'), 350);
      }
      this.returnHome(piece);
    };

    piece.addEventListener('pointerdown', onDown);
    piece.addEventListener('pointermove', onMove);
    piece.addEventListener('pointerup', onUp);
    piece.addEventListener('pointercancel', onUp);
  }

  private returnHome(piece: HTMLElement): void {
    piece.style.position = '';
    piece.style.left = '';
    piece.style.top = '';
    piece.style.width = '';
    piece.style.height = '';
    piece.style.zIndex = '';
  }

  private showCelebrate(): void {
    this.celebrate = el('div', { className: 'match-celebrate' });
    const card = el('div', { className: 'match-celebrate-card' }, [
      el('h2', {}, ['¡Muy bien!']),
      el('p', {}, [this.celebrateMessage]),
    ]);
    const again = el('button', { type: 'button', className: 'btn primary match-again' }, [
      'Otra vez',
    ]) as HTMLButtonElement;
    const exit = el('button', { type: 'button', className: 'btn' }, ['Salir']) as HTMLButtonElement;
    again.addEventListener('click', () => this.startRound());
    exit.addEventListener('click', () => this.leave());
    card.append(again, exit);
    this.celebrate.append(card);
    this.screen.append(this.celebrate);
  }
}
