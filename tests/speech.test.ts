import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeSpeechText, pickKidFriendlyVoice, speak, speakClip } from '@/shared/speech';

describe('pickKidFriendlyVoice', () => {
  it('prefers Chilean then Mexican over Spain', () => {
    const voices = [
      { name: 'Microsoft Helena', lang: 'es-ES' },
      { name: 'Google español de Estados Unidos', lang: 'es-US' },
      { name: 'Paulina', lang: 'es-MX' },
    ];
    expect(pickKidFriendlyVoice(voices)?.lang).toBe('es-MX');
    expect(pickKidFriendlyVoice([
      ...voices,
      { name: 'Isidora', lang: 'es-CL' },
    ])?.lang).toBe('es-CL');
  });

  it('returns null when there is no Spanish voice', () => {
    expect(pickKidFriendlyVoice([{ name: 'Samantha', lang: 'en-US' }])).toBeNull();
  });
});

describe('normalizeSpeechText', () => {
  it('trims and caps length for the cloud TTS cache key', () => {
    expect(normalizeSpeechText('  Perro  ')).toBe('Perro');
    expect(normalizeSpeechText('x'.repeat(100)).length).toBe(80);
  });
});

describe('speak', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not throw when speechSynthesis is missing', () => {
    const original = globalThis.speechSynthesis;
    // @ts-expect-error test cleanup
    delete globalThis.speechSynthesis;
    expect(() => speak('hola')).not.toThrow();
    globalThis.speechSynthesis = original;
  });

  it('uses a higher pitch, slower rate and LatAm lang', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no cloud')));
    const synth = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal('speechSynthesis', {
      speak: synth,
      cancel,
      getVoices: () => [{ name: 'Helena', lang: 'es-ES' }, { name: 'Paulina', lang: 'es-MX' }],
      addEventListener: vi.fn(),
    });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        text = '';
        lang = '';
        pitch = 1;
        rate = 1;
        voice: unknown = null;
        constructor(text: string) {
          this.text = text;
        }
      },
    );
    await speak('perro');
    expect(cancel).toHaveBeenCalled();
    const uttered = synth.mock.calls[0]?.[0] as { lang: string; pitch: number; rate: number; voice: { lang: string } };
    expect(uttered.lang).toBe('es-MX');
    expect(uttered.voice?.lang).toBe('es-MX');
    expect(uttered.pitch).toBeGreaterThan(1);
    expect(uttered.rate).toBeLessThan(1);
    vi.unstubAllGlobals();
  });

  it('plays ElevenLabs audio when the speech API succeeds', async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const pause = vi.fn();
    vi.stubGlobal(
      'Audio',
      class {
        src = '';
        play = play;
        pause = pause;
      },
    );
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:speech',
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/mpeg' }),
    }));
    const synth = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak: synth, cancel: vi.fn(), getVoices: () => [] });
    await speak('gato');
    expect(play).toHaveBeenCalled();
    expect(synth).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('speakClip', () => {
  it('plays a local mp3 instead of calling the speech API', async () => {
    const play = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      'Audio',
      class {
        src = '';
        play = play;
        pause = vi.fn();
        constructor(public url?: string) {
          this.src = url ?? '';
        }
      },
    );
    const fetchFn = vi.fn();
    vi.stubGlobal('fetch', fetchFn);
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] });
    await speakClip('/animals/sounds/perro.mp3', 'Perro');
    expect(play).toHaveBeenCalled();
    expect(fetchFn).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
