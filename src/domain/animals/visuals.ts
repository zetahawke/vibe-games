import type { AnimalId } from './catalog';

function fill(variant: 'color' | 'shadow', color: string): string {
  return variant === 'shadow' ? 'rgba(0,0,0,0.35)' : color;
}

/** Flat SVG markup for an animal (colored) or its drop shadow silhouette. */
export function animalSvg(id: AnimalId, variant: 'color' | 'shadow'): string {
  const f = (c: string) => fill(variant, c);
  const parts: Record<AnimalId, string> = {
    perro: `
      <ellipse cx="32" cy="38" rx="18" ry="12" fill="${f('#c48a3a')}"/>
      <circle cx="44" cy="26" r="10" fill="${f('#c48a3a')}"/>
      <ellipse cx="50" cy="22" rx="4" ry="6" fill="${f('#a86e2a')}"/>
      <ellipse cx="20" cy="48" rx="4" ry="6" fill="${f('#a86e2a')}"/>
      <ellipse cx="36" cy="48" rx="4" ry="6" fill="${f('#a86e2a')}"/>
      <circle cx="47" cy="24" r="1.5" fill="${variant === 'shadow' ? 'rgba(0,0,0,0.35)' : '#222'}"/>`,
    gato: `
      <ellipse cx="32" cy="40" rx="14" ry="12" fill="${f('#e8a838')}"/>
      <circle cx="32" cy="24" r="11" fill="${f('#e8a838')}"/>
      <polygon points="22,18 24,8 30,18" fill="${f('#e8a838')}"/>
      <polygon points="34,18 40,8 42,18" fill="${f('#e8a838')}"/>
      <ellipse cx="48" cy="42" rx="3" ry="10" fill="${f('#d49220')}"/>
      <circle cx="28" cy="22" r="1.5" fill="${variant === 'shadow' ? 'rgba(0,0,0,0.35)' : '#222'}"/>
      <circle cx="36" cy="22" r="1.5" fill="${variant === 'shadow' ? 'rgba(0,0,0,0.35)' : '#222'}"/>`,
    pajaro: `
      <ellipse cx="30" cy="34" rx="14" ry="10" fill="${f('#4a90d9')}"/>
      <circle cx="42" cy="28" r="8" fill="${f('#4a90d9')}"/>
      <polygon points="50,28 60,30 50,34" fill="${f('#e8a020')}"/>
      <ellipse cx="22" cy="34" rx="8" ry="4" fill="${f('#3a78b8')}"/>
      <line x1="28" y1="42" x2="24" y2="54" stroke="${f('#e8a020')}" stroke-width="3"/>
      <line x1="34" y1="42" x2="38" y2="54" stroke="${f('#e8a020')}" stroke-width="3"/>
      <circle cx="44" cy="26" r="1.5" fill="${variant === 'shadow' ? 'rgba(0,0,0,0.35)' : '#222'}"/>`,
    pez: `
      <ellipse cx="34" cy="32" rx="16" ry="10" fill="${f('#3db8c5')}"/>
      <polygon points="14,32 4,22 4,42" fill="${f('#2a9aa5')}"/>
      <polygon points="40,22 46,14 48,24" fill="${f('#2a9aa5')}"/>
      <circle cx="44" cy="30" r="2" fill="${variant === 'shadow' ? 'rgba(0,0,0,0.35)' : '#222'}"/>`,
    vaca: `
      <ellipse cx="32" cy="40" rx="18" ry="12" fill="${f('#f2f2f0')}"/>
      <circle cx="46" cy="28" r="9" fill="${f('#f2f2f0')}"/>
      <ellipse cx="22" cy="36" rx="5" ry="4" fill="${f('#333')}"/>
      <ellipse cx="36" cy="44" rx="4" ry="3" fill="${f('#333')}"/>
      <rect x="18" y="48" width="5" height="10" rx="1" fill="${f('#c48a3a')}"/>
      <rect x="40" y="48" width="5" height="10" rx="1" fill="${f('#c48a3a')}"/>
      <circle cx="49" cy="26" r="1.5" fill="${variant === 'shadow' ? 'rgba(0,0,0,0.35)' : '#222'}"/>
      <ellipse cx="52" cy="34" rx="3" ry="2" fill="${f('#f4a0b0')}"/>`,
    cerdo: `
      <ellipse cx="32" cy="38" rx="16" ry="12" fill="${f('#f0a0b4')}"/>
      <circle cx="44" cy="28" r="9" fill="${f('#f0a0b4')}"/>
      <ellipse cx="48" cy="30" rx="5" ry="3.5" fill="${f('#e08098')}"/>
      <circle cx="46" cy="29" r="1" fill="${variant === 'shadow' ? 'rgba(0,0,0,0.35)' : '#222'}"/>
      <circle cx="50" cy="29" r="1" fill="${variant === 'shadow' ? 'rgba(0,0,0,0.35)' : '#222'}"/>
      <ellipse cx="18" cy="36" rx="3" ry="5" fill="${f('#e08098')}"/>
      <rect x="24" y="48" width="4" height="8" rx="1" fill="${f('#e08098')}"/>
      <rect x="36" y="48" width="4" height="8" rx="1" fill="${f('#e08098')}"/>`,
    conejo: `
      <ellipse cx="32" cy="42" rx="12" ry="10" fill="${f('#e8dcc8')}"/>
      <circle cx="32" cy="28" r="10" fill="${f('#e8dcc8')}"/>
      <ellipse cx="26" cy="12" rx="4" ry="12" fill="${f('#e8dcc8')}"/>
      <ellipse cx="38" cy="12" rx="4" ry="12" fill="${f('#e8dcc8')}"/>
      <ellipse cx="26" cy="12" rx="2" ry="8" fill="${f('#f0a0b4')}"/>
      <ellipse cx="38" cy="12" rx="2" ry="8" fill="${f('#f0a0b4')}"/>
      <circle cx="28" cy="26" r="1.5" fill="${variant === 'shadow' ? 'rgba(0,0,0,0.35)' : '#222'}"/>
      <circle cx="36" cy="26" r="1.5" fill="${variant === 'shadow' ? 'rgba(0,0,0,0.35)' : '#222'}"/>`,
    pato: `
      <ellipse cx="30" cy="38" rx="14" ry="10" fill="${f('#f0d030')}"/>
      <circle cx="42" cy="28" r="9" fill="${f('#f0d030')}"/>
      <polygon points="50,28 62,30 50,34" fill="${f('#e87820')}"/>
      <ellipse cx="22" cy="36" rx="6" ry="3" fill="${f('#e8c020')}"/>
      <circle cx="44" cy="26" r="1.5" fill="${variant === 'shadow' ? 'rgba(0,0,0,0.35)' : '#222'}"/>
      <ellipse cx="28" cy="48" rx="8" ry="3" fill="${f('#e87820')}"/>`,
  };

  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${parts[id]}</svg>`;
}
