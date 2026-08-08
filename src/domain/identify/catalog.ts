export type IdentifyTheme = 'vowels' | 'numbers' | 'alphabet';

export type IdentifyId = string;

const VOWELS: IdentifyId[] = ['A', 'E', 'I', 'O', 'U'];

const NUMBERS: IdentifyId[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const ALPHABET: IdentifyId[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
];

const NUMBER_WORDS: Record<string, string> = {
  '1': 'uno',  '2': 'dos',   '3': 'tres',  '4': 'cuatro',
  '5': 'cinco','6': 'seis',  '7': 'siete', '8': 'ocho',
  '9': 'nueve','10': 'diez',
};

const LETTER_NAMES: Record<string, string> = {
  A: 'a',   B: 'be',   C: 'ce',    D: 'de',   E: 'e',
  F: 'efe', G: 'ge',   H: 'hache', I: 'i',    J: 'jota',
  K: 'ka',  L: 'ele',  M: 'eme',   N: 'ene',  Ñ: 'eñe',
  O: 'o',   P: 'pe',   Q: 'cu',    R: 'erre', S: 'ese',
  T: 'te',  U: 'u',    V: 'uve',   W: 'uve doble',
  X: 'equis', Y: 'ye', Z: 'zeta',
};

export function poolForTheme(theme: IdentifyTheme): IdentifyId[] {
  if (theme === 'vowels') return [...VOWELS];
  if (theme === 'numbers') return [...NUMBERS];
  return [...ALPHABET];
}

export function glyphLabel(id: IdentifyId): string {
  return id;
}

export function spokenLabel(theme: IdentifyTheme, id: IdentifyId): string {
  if (theme === 'numbers') return NUMBER_WORDS[id] ?? id;
  if (theme === 'vowels') return id.toLowerCase();
  return LETTER_NAMES[id] ?? id.toLowerCase();
}

export function themeTitle(theme: IdentifyTheme): string {
  if (theme === 'vowels') return 'Vocales';
  if (theme === 'numbers') return 'Números';
  return 'Abecedario';
}

/** Migrate old Spanish theme value to English. */
export function migrateTheme(t: string): IdentifyTheme {
  const map: Record<string, IdentifyTheme> = {
    vocales: 'vowels', numeros: 'numbers', abecedario: 'alphabet',
  };
  return (map[t] ?? t) as IdentifyTheme;
}
