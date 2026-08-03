import type { AnimalId } from './catalog';

function fill(variant: 'color' | 'shadow', color: string): string {
  return variant === 'shadow' ? 'rgba(0,0,0,0.38)' : color;
}

function ink(variant: 'color' | 'shadow'): string {
  return variant === 'shadow' ? 'rgba(0,0,0,0.38)' : '#1a1a1a';
}

/** Flat SVG markup for an animal (colored) or its drop shadow silhouette. */
export function animalSvg(id: AnimalId, variant: 'color' | 'shadow'): string {
  const f = (c: string) => fill(variant, c);
  const k = ink(variant);

  const parts: Record<AnimalId, string> = {
    // Floppy ears + snout + collar — clearly a dog
    perro: `
      <ellipse cx="32" cy="40" rx="16" ry="13" fill="${f('#c48a3a')}"/>
      <circle cx="32" cy="22" r="12" fill="${f('#c48a3a')}"/>
      <ellipse cx="18" cy="20" rx="6" ry="11" fill="${f('#a86e2a')}" transform="rotate(-18 18 20)"/>
      <ellipse cx="46" cy="20" rx="6" ry="11" fill="${f('#a86e2a')}" transform="rotate(18 46 20)"/>
      <ellipse cx="32" cy="26" rx="8" ry="5" fill="${f('#d4a05a')}"/>
      <circle cx="27" cy="20" r="2.2" fill="${k}"/>
      <circle cx="37" cy="20" r="2.2" fill="${k}"/>
      <ellipse cx="32" cy="28" rx="2.5" ry="1.8" fill="${k}"/>
      <rect x="24" y="46" width="16" height="5" rx="2" fill="${f('#3a6fd0')}"/>
      <circle cx="40" cy="48.5" r="2.5" fill="${f('#e8c020')}"/>
      <ellipse cx="22" cy="52" rx="4" ry="5" fill="${f('#a86e2a')}"/>
      <ellipse cx="42" cy="52" rx="4" ry="5" fill="${f('#a86e2a')}"/>`,

    // Pointed ears + whiskers + triangle nose
    gato: `
      <ellipse cx="32" cy="42" rx="14" ry="12" fill="${f('#e8a838')}"/>
      <circle cx="32" cy="26" r="12" fill="${f('#e8a838')}"/>
      <polygon points="20,22 18,6 28,18" fill="${f('#e8a838')}"/>
      <polygon points="44,22 46,6 36,18" fill="${f('#e8a838')}"/>
      <polygon points="21,18 19,9 26,16" fill="${f('#f0a0b4')}"/>
      <polygon points="43,18 45,9 38,16" fill="${f('#f0a0b4')}"/>
      <circle cx="26" cy="24" r="2.2" fill="${k}"/>
      <circle cx="38" cy="24" r="2.2" fill="${k}"/>
      <polygon points="32,27 28,32 36,32" fill="${f('#f0a0b4')}"/>
      <line x1="12" y1="28" x2="24" y2="30" stroke="${k}" stroke-width="1.5"/>
      <line x1="12" y1="33" x2="24" y2="32" stroke="${k}" stroke-width="1.5"/>
      <line x1="52" y1="28" x2="40" y2="30" stroke="${k}" stroke-width="1.5"/>
      <line x1="52" y1="33" x2="40" y2="32" stroke="${k}" stroke-width="1.5"/>
      <path d="M46 40 Q58 36 54 52" fill="none" stroke="${f('#d49220')}" stroke-width="4" stroke-linecap="round"/>`,

    // Big beak + wing + stick legs
    pajaro: `
      <ellipse cx="28" cy="34" rx="15" ry="12" fill="${f('#4a90d9')}"/>
      <circle cx="44" cy="28" r="10" fill="${f('#4a90d9')}"/>
      <polygon points="52,26 64,30 52,36" fill="${f('#f0a020')}"/>
      <ellipse cx="20" cy="34" rx="10" ry="5" fill="${f('#2f6fb8')}"/>
      <circle cx="46" cy="25" r="2.2" fill="${k}"/>
      <line x1="24" y1="44" x2="18" y2="58" stroke="${f('#f0a020')}" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="32" y1="44" x2="38" y2="58" stroke="${f('#f0a020')}" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="16" y1="58" x2="22" y2="58" stroke="${f('#f0a020')}" stroke-width="3" stroke-linecap="round"/>
      <line x1="36" y1="58" x2="42" y2="58" stroke="${f('#f0a020')}" stroke-width="3" stroke-linecap="round"/>`,

    // Classic fish side view
    pez: `
      <ellipse cx="34" cy="32" rx="18" ry="12" fill="${f('#3db8c5')}"/>
      <polygon points="16,32 2,18 2,46" fill="${f('#2a9aa5')}"/>
      <polygon points="34,20 42,8 46,22" fill="${f('#2a9aa5')}"/>
      <polygon points="34,44 42,56 46,42" fill="${f('#2a9aa5')}"/>
      <circle cx="46" cy="28" r="3" fill="${k}"/>
      <circle cx="47" cy="27" r="1" fill="${variant === 'shadow' ? 'rgba(0,0,0,0.38)' : '#fff'}"/>
      <path d="M28 32 Q34 26 40 32 Q34 38 28 32" fill="${f('#7ad4dc')}"/>`,

    // Horns + spots + pink snout
    vaca: `
      <ellipse cx="32" cy="40" rx="18" ry="13" fill="${f('#f5f5f2')}"/>
      <circle cx="32" cy="22" r="11" fill="${f('#f5f5f2')}"/>
      <ellipse cx="18" cy="10" rx="3" ry="7" fill="${f('#d8d0c0')}" transform="rotate(-25 18 10)"/>
      <ellipse cx="46" cy="10" rx="3" ry="7" fill="${f('#d8d0c0')}" transform="rotate(25 46 10)"/>
      <ellipse cx="22" cy="36" rx="5" ry="4" fill="${k}"/>
      <ellipse cx="40" cy="44" rx="6" ry="5" fill="${k}"/>
      <ellipse cx="32" cy="28" rx="7" ry="5" fill="${f('#f4a0b0')}"/>
      <circle cx="29" cy="27" r="1.2" fill="${k}"/>
      <circle cx="35" cy="27" r="1.2" fill="${k}"/>
      <circle cx="26" cy="18" r="2" fill="${k}"/>
      <circle cx="38" cy="18" r="2" fill="${k}"/>
      <rect x="20" y="50" width="6" height="10" rx="2" fill="${f('#c48a3a')}"/>
      <rect x="38" y="50" width="6" height="10" rx="2" fill="${f('#c48a3a')}"/>`,

    // Big snout with nostrils + curly tail
    cerdo: `
      <ellipse cx="32" cy="38" rx="17" ry="14" fill="${f('#f0a0b4')}"/>
      <circle cx="32" cy="22" r="12" fill="${f('#f0a0b4')}"/>
      <ellipse cx="20" cy="14" rx="4" ry="6" fill="${f('#e08098')}"/>
      <ellipse cx="44" cy="14" rx="4" ry="6" fill="${f('#e08098')}"/>
      <ellipse cx="32" cy="28" rx="9" ry="7" fill="${f('#e87898')}"/>
      <circle cx="27" cy="28" r="2.5" fill="${k}"/>
      <circle cx="37" cy="28" r="2.5" fill="${k}"/>
      <circle cx="26" cy="18" r="2" fill="${k}"/>
      <circle cx="38" cy="18" r="2" fill="${k}"/>
      <path d="M48 40 Q60 32 56 48" fill="none" stroke="${f('#e08098')}" stroke-width="4" stroke-linecap="round"/>
      <rect x="22" y="50" width="6" height="9" rx="2" fill="${f('#e08098')}"/>
      <rect x="36" y="50" width="6" height="9" rx="2" fill="${f('#e08098')}"/>`,

    // Extra-long ears (main cue)
    conejo: `
      <ellipse cx="32" cy="44" rx="13" ry="11" fill="${f('#e8dcc8')}"/>
      <circle cx="32" cy="30" r="11" fill="${f('#e8dcc8')}"/>
      <ellipse cx="22" cy="10" rx="5" ry="16" fill="${f('#e8dcc8')}"/>
      <ellipse cx="42" cy="10" rx="5" ry="16" fill="${f('#e8dcc8')}"/>
      <ellipse cx="22" cy="10" rx="2.5" ry="12" fill="${f('#f0a0b4')}"/>
      <ellipse cx="42" cy="10" rx="2.5" ry="12" fill="${f('#f0a0b4')}"/>
      <circle cx="27" cy="28" r="2.2" fill="${k}"/>
      <circle cx="37" cy="28" r="2.2" fill="${k}"/>
      <ellipse cx="32" cy="34" rx="3" ry="2" fill="${f('#f0a0b4')}"/>
      <ellipse cx="48" cy="46" rx="4" ry="3" fill="${f('#e8dcc8')}"/>`,

    // Flat bill + orange feet (not a pointed bird beak)
    pato: `
      <ellipse cx="30" cy="38" rx="15" ry="12" fill="${f('#f0d030')}"/>
      <circle cx="44" cy="28" r="11" fill="${f('#f0d030')}"/>
      <ellipse cx="56" cy="30" rx="9" ry="4.5" fill="${f('#e87820')}"/>
      <ellipse cx="18" cy="36" rx="8" ry="4" fill="${f('#e8c020')}"/>
      <circle cx="46" cy="24" r="2.2" fill="${k}"/>
      <ellipse cx="24" cy="52" rx="7" ry="3.5" fill="${f('#e87820')}"/>
      <ellipse cx="38" cy="52" rx="7" ry="3.5" fill="${f('#e87820')}"/>
      <rect x="26" y="44" width="3" height="8" fill="${f('#e87820')}"/>
      <rect x="36" y="44" width="3" height="8" fill="${f('#e87820')}"/>`,
  };

  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${parts[id]}</svg>`;
}
