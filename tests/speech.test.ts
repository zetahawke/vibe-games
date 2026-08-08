import { describe, expect, it, vi } from 'vitest';
import { speak } from '@/shared/speech';

describe('speak', () => {
  it('does not throw when speechSynthesis is missing', () => {
    const original = globalThis.speechSynthesis;
    // @ts-expect-error test cleanup
    delete globalThis.speechSynthesis;
    expect(() => speak('hola')).not.toThrow();
    globalThis.speechSynthesis = original;
  });

  it('calls speak when speechSynthesis exists', () => {
    const synth = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak: synth, cancel, getVoices: () => [] });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        text = '';
        lang = '';
        constructor(text: string) {
          this.text = text;
        }
      },
    );
    speak('uno');
    expect(cancel).toHaveBeenCalled();
    expect(synth).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
