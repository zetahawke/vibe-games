/** Speak text in Spanish via Web Speech API; no-op if unavailable. */
export function speakEs(text: string): void {
  if (typeof window === 'undefined') return;
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    const voices = synth.getVoices();
    const es = voices.find((v) => v.lang.toLowerCase().startsWith('es'));
    if (es) u.voice = es;
    synth.speak(u);
  } catch {
    /* ignore */
  }
}
