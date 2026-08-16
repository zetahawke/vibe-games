import type { WeaponKind } from '@/domain/weapons/weapons';

type Note = { freq: number; ms: number; type?: OscillatorType };

let ctx: AudioContext | null = null;

/** Clean public URLs under `/guns/` — kunai reuses shuriken throw. */
export const WEAPON_SHOT_URL: Record<WeaponKind, string> = {
  knife: '/guns/sword.mp3',
  sword_shield: '/guns/sword.mp3',
  longsword: '/guns/sword.mp3',
  pistol: '/guns/pistol.mp3',
  shotgun: '/guns/shotgun.mp3',
  rifle: '/guns/rifle.mp3',
  bow: '/guns/bow.mp3',
  shuriken: '/guns/shuriken.mp3',
  kunai: '/guns/shuriken.mp3',
};

function audio(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function playTone(freq: number, durationMs: number, type: OscillatorType = 'sine'): void {
  const ac = audio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.09;
    osc.connect(gain);
    gain.connect(ac.destination);
    const end = ac.currentTime + durationMs / 1000;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    osc.stop(end);
  } catch {
    /* audio optional */
  }
}

function playNotes(notes: Note[], gapMs: number): void {
  notes.forEach((n, i) => {
    window.setTimeout(() => playTone(n.freq, n.ms, n.type), i * gapMs);
  });
}

const UPGRADE_JINGLES: Note[][] = [
  [
    { freq: 392, ms: 110, type: 'square' },
    { freq: 523, ms: 140, type: 'square' },
  ],
  [
    { freq: 440, ms: 90, type: 'triangle' },
    { freq: 554, ms: 90, type: 'triangle' },
    { freq: 659, ms: 160, type: 'triangle' },
  ],
  [
    { freq: 330, ms: 100, type: 'sawtooth' },
    { freq: 494, ms: 180, type: 'square' },
  ],
  [
    { freq: 523, ms: 80, type: 'sine' },
    { freq: 659, ms: 80, type: 'sine' },
    { freq: 784, ms: 90, type: 'sine' },
    { freq: 1046, ms: 160, type: 'triangle' },
  ],
];

export function playWeaponUpgrade(index: number): void {
  const patch = UPGRADE_JINGLES[((index % 4) + 4) % 4] ?? UPGRADE_JINGLES[0]!;
  playNotes(patch, 85);
}

function playNoise(durationMs: number, volume: number, bandHz: number): void {
  const ac = audio();
  if (!ac) return;
  try {
    const n = Math.max(1, Math.floor(ac.sampleRate * (durationMs / 1000)));
    const buffer = ac.createBuffer(1, n, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = bandHz;
    filter.Q.value = 0.7;
    const gain = ac.createGain();
    gain.gain.value = volume;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start();
  } catch {
    /* audio optional */
  }
}

/** Fallback synth if the sample fails to load/play. */
function playGunshotSynth(kind: WeaponKind): void {
  if (kind === 'knife' || kind === 'sword_shield' || kind === 'longsword') {
    playTone(240, 70, 'triangle');
    return;
  }
  if (kind === 'kunai' || kind === 'shuriken') {
    playTone(520, 40, 'sine');
    playTone(280, 70, 'triangle');
    return;
  }
  if (kind === 'bow') {
    playTone(480, 50, 'triangle');
    playTone(320, 80, 'sine');
    return;
  }
  if (kind === 'pistol') {
    playNoise(55, 0.22, 2400);
    playTone(160, 40, 'square');
    return;
  }
  if (kind === 'shotgun') {
    playNoise(140, 0.28, 900);
    playTone(90, 80, 'sawtooth');
    return;
  }
  playNoise(40, 0.18, 3200);
  playTone(210, 35, 'square');
}

function playSample(url: string, onFail: () => void): void {
  try {
    const a = new Audio(url);
    a.volume = 0.55;
    const play = a.play();
    if (play && typeof play.catch === 'function') {
      void play.catch(onFail);
    }
  } catch {
    onFail();
  }
}

export function playGunshot(kind: WeaponKind): void {
  const url = WEAPON_SHOT_URL[kind];
  if (!url) {
    playGunshotSynth(kind);
    return;
  }
  playSample(url, () => playGunshotSynth(kind));
}

export function playSoftFail(): void {
  playTone(180, 180, 'triangle');
}

export function playSuccessPing(): void {
  playTone(520, 120, 'sine');
  window.setTimeout(() => playTone(720, 140, 'sine'), 90);
}
