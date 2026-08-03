import { describe, expect, it, vi } from 'vitest';
import { speakEs } from '@/shared/speech';

describe('speakEs', () => {
  it('does not throw when speechSynthesis is missing', () => {
    const original = globalThis.speechSynthesis;
    // @ts-expect-error test cleanup
    delete globalThis.speechSynthesis;
    expect(() => speakEs('hola')).not.toThrow();
    globalThis.speechSynthesis = original;
  });

  it('calls speak when speechSynthesis exists', () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices: () => [] });
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
    speakEs('uno');
    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
