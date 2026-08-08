/** Speak text in Spanish via the Web Speech API; no-op if unavailable. */
export function speak(text: string): void {
  if (typeof window === 'undefined') return;
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    const voices = synth.getVoices();
    const esVoice = voices.find((v) => v.lang.toLowerCase().startsWith('es'));
    if (esVoice) u.voice = esVoice;
    synth.speak(u);
  } catch {
    /* ignore */
  }
}
