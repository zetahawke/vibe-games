export interface SpeechVoiceLike {
  lang: string;
  name: string;
}

const LATAM = /es-(cl|mx|us|419|ar|co|pe|ve|ec|uy|py|bo|cr|pa|gt|hn|sv|ni|do|pr)/i;

function voiceScore(v: SpeechVoiceLike): number {
  const lang = v.lang.toLowerCase().replace('_', '-');
  const name = v.name.toLowerCase();
  let score = 0;
  if (!lang.startsWith('es')) return -1;
  score += 10;
  if (lang.startsWith('es-cl')) score += 100;
  else if (lang.startsWith('es-mx')) score += 90;
  else if (lang.startsWith('es-us') || lang.startsWith('es-419')) score += 80;
  else if (LATAM.test(lang)) score += 70;
  else if (lang.startsWith('es-es')) score += 20;
  if (/child|niñ|kid|kids|junior/.test(name)) score += 50;
  if (/paulina|sabina|isidora|mexico|latina|latam/.test(name)) score += 15;
  return score;
}

export function pickKidFriendlyVoice<T extends SpeechVoiceLike>(voices: T[]): T | null {
  let best: T | null = null;
  let bestScore = 0;
  for (const v of voices) {
    const s = voiceScore(v);
    if (s > bestScore) {
      best = v;
      bestScore = s;
    }
  }
  return best;
}

export function normalizeSpeechText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').slice(0, 80);
}

let currentAudio: HTMLAudioElement | null = null;
let inflight: AbortController | null = null;
const cloudCache = new Map<string, Blob>();

function stopBrowser(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}

function stopCloud(): void {
  inflight?.abort();
  inflight = null;
  if (!currentAudio) return;
  currentAudio.pause();
  currentAudio.src = '';
  currentAudio = null;
}

function speakBrowser(text: string): void {
  if (typeof window === 'undefined') return;
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-MX';
    u.pitch = 1.25;
    u.rate = 0.92;
    const picked = pickKidFriendlyVoice(synth.getVoices());
    if (picked) {
      u.voice = picked;
      u.lang = picked.lang || 'es-MX';
    }
    synth.speak(u);
  } catch {
    /* ignore */
  }
}

function playBlob(blob: Blob, fallbackText: string): void {
  stopBrowser();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  audio.onended = () => {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) currentAudio = null;
  };
  void audio.play().catch(() => {
    URL.revokeObjectURL(url);
    speakBrowser(fallbackText);
  });
}

/** Play a local clip (e.g. `/animals/sounds/perro.mp3`); fall back to TTS. */
export async function speakClip(url: string, fallbackText: string): Promise<void> {
  const clean = normalizeSpeechText(fallbackText);
  if (!url || typeof window === 'undefined') return;
  stopCloud();
  stopBrowser();
  const audio = new Audio(url);
  currentAudio = audio;
  audio.onended = () => {
    if (currentAudio === audio) currentAudio = null;
  };
  audio.onerror = () => {
    if (currentAudio === audio) currentAudio = null;
    if (clean) void speak(clean);
  };
  try {
    await audio.play();
  } catch {
    if (clean) await speak(clean);
  }
}

/** Prefer ElevenLabs (via /api/speech); fall back to the OS voice. */
export async function speak(text: string): Promise<void> {
  const clean = normalizeSpeechText(text);
  if (!clean || typeof window === 'undefined') return;
  stopCloud();
  stopBrowser();

  const cached = cloudCache.get(clean);
  if (cached) {
    playBlob(cached, clean);
    return;
  }

  const ac = new AbortController();
  inflight = ac;
  try {
    const res = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean }),
      signal: ac.signal,
    });
    if (!res.ok) {
      speakBrowser(clean);
      return;
    }
    const blob = await res.blob();
    if (ac.signal.aborted) return;
    cloudCache.set(clean, blob);
    playBlob(blob, clean);
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    speakBrowser(clean);
  }
}
