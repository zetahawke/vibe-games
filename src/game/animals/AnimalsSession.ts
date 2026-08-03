import {
  animalArtHtml,
  animalName,
  pickRound,
  resolveDrop,
  type AnimalId,
  type DropMode,
  type GraphicsStyle,
} from '@/domain/animals';
import { clear, el } from '@/shared/dom';

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

function playSuccess(): void {
  playTone(520, 120, 'sine');
  setTimeout(() => playTone(720, 140, 'sine'), 90);
}

export class AnimalsSession {
  private screen: HTMLElement;
  private shadowsRow: HTMLElement;
  private animalsRow: HTMLElement;
  private celebrate: HTMLElement | null = null;
  private round: AnimalId[] = [];
  private placed = new Set<AnimalId>();
  private home = new Map<HTMLElement, { left: number; top: number }>();
  private disposed = false;

  constructor(
    private root: HTMLElement,
    _username: string,
    private dropMode: DropMode,
    private graphicsStyle: GraphicsStyle,
    private onExit: () => void,
  ) {
    clear(this.root);
    this.screen = el('section', { className: 'animals-screen' });
    const header = el('header', { className: 'animals-header' }, [
      el('h1', {}, ['Animales']),
    ]);
    const exitBtn = el('button', { type: 'button', className: 'btn ghost animals-exit' }, [
      'Salir',
    ]) as HTMLButtonElement;
    exitBtn.addEventListener('click', () => this.leave());
    header.append(exitBtn);

    this.shadowsRow = el('div', { className: 'shadows-row', 'aria-label': 'Sombras' });
    this.animalsRow = el('div', { className: 'animals-row', 'aria-label': 'Animales' });
    this.screen.append(header, this.shadowsRow, this.animalsRow);
    this.root.append(this.screen);
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
    this.home.clear();
    clear(this.shadowsRow);
    clear(this.animalsRow);
    this.round = pickRound();

    for (const id of this.round) {
      const name = animalName(id);
      const shadow = el('div', {
        className: 'animal-shadow',
        'data-shadow-id': id,
        title: name,
      });
      const shadowArt = el('div', {
        className:
          this.graphicsStyle === 'realista' ? 'animal-art animal-art-photo animal-art-shadow' : 'animal-art',
      });
      shadowArt.innerHTML = animalArtHtml(id, this.graphicsStyle, 'shadow');
      shadow.append(shadowArt, el('span', { className: 'animal-label' }, [name]));
      this.shadowsRow.append(shadow);

      const piece = el('button', {
        type: 'button',
        className: 'animal-piece',
        'data-animal-id': id,
        'aria-label': name,
      }) as HTMLButtonElement;
      const pieceArt = el('div', {
        className: this.graphicsStyle === 'realista' ? 'animal-art animal-art-photo' : 'animal-art',
      });
      pieceArt.innerHTML = animalArtHtml(id, this.graphicsStyle, 'color');
      piece.append(pieceArt, el('span', { className: 'animal-label' }, [name]));
      this.animalsRow.append(piece);
      this.bindDrag(piece, id);
    }

    // Record home positions after layout
    requestAnimationFrame(() => {
      for (const piece of this.animalsRow.querySelectorAll<HTMLElement>('.animal-piece')) {
        const r = piece.getBoundingClientRect();
        const parent = this.screen.getBoundingClientRect();
        this.home.set(piece, { left: r.left - parent.left, top: r.top - parent.top });
      }
    });
  }

  private bindDrag(piece: HTMLElement, id: AnimalId): void {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onDown = (e: PointerEvent) => {
      if (this.placed.has(id) || this.disposed) return;
      e.preventDefault();
      dragging = true;
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
      piece.releasePointerCapture(e.pointerId);

      const cx = e.clientX;
      const cy = e.clientY;
      piece.style.visibility = 'hidden';
      const under = document.elementFromPoint(cx, cy);
      piece.style.visibility = '';

      const shadowEl = under?.closest?.('[data-shadow-id]') as HTMLElement | null;
      const targetId = (shadowEl?.dataset.shadowId as AnimalId | undefined) ?? null;
      const filled = shadowEl?.hasAttribute('data-filled') ?? false;
      const effectiveTarget = filled ? null : targetId;

      const result = resolveDrop(this.dropMode, id, effectiveTarget);
      if (result.accept && shadowEl) {
        playSuccess();
        this.placed.add(id);
        shadowEl.setAttribute('data-filled', 'true');
        shadowEl.classList.add('filled');
        piece.classList.add('placed');
        piece.style.position = '';
        piece.style.left = '';
        piece.style.top = '';
        piece.style.width = '';
        piece.style.height = '';
        piece.style.zIndex = '';
        const art = shadowEl.querySelector('.animal-art');
        if (art) {
          art.classList.remove('animal-art-shadow');
          art.innerHTML = animalArtHtml(id, this.graphicsStyle, 'color');
        }
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
    this.celebrate = el('div', { className: 'animals-celebrate' });
    const card = el('div', { className: 'animals-celebrate-card' }, [
      el('h2', {}, ['¡Muy bien!']),
      el('p', {}, ['Todos los animales encontraron su sombra.']),
    ]);
    const again = el('button', { type: 'button', className: 'btn primary animals-again' }, [
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
