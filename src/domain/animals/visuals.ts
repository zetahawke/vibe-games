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

    // Leaping arc body + dorsal fin + smile
    delfin: `
      <path d="M8 38 Q22 18 38 28 Q52 36 58 30" fill="none" stroke="${f('#7a8a98')}" stroke-width="14" stroke-linecap="round"/>
      <path d="M8 38 Q22 18 38 28 Q52 36 58 30" fill="none" stroke="${f('#9aacb8')}" stroke-width="10" stroke-linecap="round"/>
      <polygon points="30,14 34,26 26,24" fill="${f('#6a7a88')}"/>
      <ellipse cx="52" cy="28" rx="7" ry="5" fill="${f('#9aacb8')}"/>
      <circle cx="54" cy="26" r="2" fill="${k}"/>
      <path d="M50 32 Q54 35 58 32" fill="none" stroke="${k}" stroke-width="1.5" stroke-linecap="round"/>
      <polygon points="6,38 2,44 10,42" fill="${f('#7a8a98')}"/>`,

    // Sharp snout + triangle dorsal fin + tail
    tiburon: `
      <ellipse cx="34" cy="34" rx="20" ry="11" fill="${f('#6a7888')}"/>
      <polygon points="14,34 4,22 4,46" fill="${f('#5a6878')}"/>
      <polygon points="36,20 44,8 48,24" fill="${f('#5a6878')}"/>
      <ellipse cx="50" cy="32" rx="10" ry="7" fill="${f('#6a7888')}"/>
      <polygon points="58,28 64,34 58,40" fill="${f('#5a6878')}"/>
      <circle cx="52" cy="30" r="2.2" fill="${k}"/>
      <polygon points="34,44 40,56 44,42" fill="${f('#5a6878')}"/>
      <rect x="28" y="30" width="3" height="5" rx="1" fill="${k}"/>
      <rect x="33" y="30" width="3" height="5" rx="1" fill="${k}"/>
      <rect x="38" y="30" width="3" height="5" rx="1" fill="${k}"/>`,

    // Hex shell + flippers + small head
    tortuga: `
      <ellipse cx="32" cy="36" rx="18" ry="14" fill="${f('#3a8a48')}"/>
      <polygon points="24,30 32,26 40,30 40,38 32,42 24,38" fill="${f('#2a7040')}" stroke="${f('#1a5830')}" stroke-width="1"/>
      <polygon points="32,26 36,32 32,38 28,32" fill="${f('#4a9a58')}"/>
      <ellipse cx="32" cy="36" rx="6" ry="5" fill="${f('#2a7040')}"/>
      <ellipse cx="14" cy="40" rx="7" ry="4" fill="${f('#4a9a58')}" transform="rotate(-20 14 40)"/>
      <ellipse cx="50" cy="40" rx="7" ry="4" fill="${f('#4a9a58')}" transform="rotate(20 50 40)"/>
      <circle cx="32" cy="52" r="7" fill="${f('#5aaa68')}"/>
      <circle cx="30" cy="50" r="1.5" fill="${k}"/>
      <circle cx="34" cy="50" r="1.5" fill="${k}"/>
      <ellipse cx="32" cy="54" rx="2" ry="1.2" fill="${k}"/>`,

    // Brown body + BIG curved horns + nose ring
    toro: `
      <ellipse cx="32" cy="42" rx="16" ry="12" fill="${f('#8a5a30')}"/>
      <circle cx="32" cy="26" r="11" fill="${f('#8a5a30')}"/>
      <path d="M14 18 Q8 4 18 8 Q22 14 20 22" fill="${f('#d8c8a0')}" stroke="${f('#b8a880')}" stroke-width="1"/>
      <path d="M50 18 Q56 4 46 8 Q42 14 44 22" fill="${f('#d8c8a0')}" stroke="${f('#b8a880')}" stroke-width="1"/>
      <ellipse cx="32" cy="32" rx="8" ry="6" fill="${f('#704828')}"/>
      <ellipse cx="32" cy="32" rx="5" ry="4" fill="none" stroke="${f('#c8a878')}" stroke-width="2"/>
      <circle cx="28" cy="24" r="2" fill="${k}"/>
      <circle cx="36" cy="24" r="2" fill="${k}"/>
      <ellipse cx="32" cy="30" rx="2" ry="1.5" fill="${k}"/>
      <rect x="22" y="52" width="6" height="8" rx="2" fill="${f('#704828')}"/>
      <rect x="36" y="52" width="6" height="8" rx="2" fill="${f('#704828')}"/>`,

    // Profile horse + flowing mane + long face
    caballo: `
      <ellipse cx="28" cy="42" rx="14" ry="11" fill="${f('#8a5a30')}"/>
      <ellipse cx="46" cy="30" rx="10" ry="8" fill="${f('#8a5a30')}"/>
      <rect x="52" y="26" width="10" height="5" rx="2" fill="${f('#704828')}"/>
      <path d="M38 18 Q34 8 42 6 Q48 10 46 20 Q40 24 38 18" fill="${f('#3a2820')}"/>
      <path d="M34 20 Q28 14 30 8 Q36 6 38 18" fill="${f('#3a2820')}"/>
      <circle cx="48" cy="26" r="2" fill="${k}"/>
      <ellipse cx="58" cy="30" rx="2" ry="1.5" fill="${k}"/>
      <rect x="20" y="50" width="5" height="10" rx="1.5" fill="${f('#5a3820')}"/>
      <rect x="30" y="50" width="5" height="10" rx="1.5" fill="${f('#5a3820')}"/>
      <rect x="38" y="50" width="5" height="10" rx="1.5" fill="${f('#5a3820')}"/>
      <rect x="46" y="50" width="5" height="10" rx="1.5" fill="${f('#5a3820')}"/>`,

    // Bipedal T-rex + tiny arms + big head with teeth
    tiranosaurio: `
      <ellipse cx="28" cy="38" rx="12" ry="14" fill="${f('#4a8848')}"/>
      <ellipse cx="44" cy="22" rx="14" ry="12" fill="${f('#4a8848')}"/>
      <rect x="18" y="48" width="7" height="12" rx="2" fill="${f('#3a6838')}"/>
      <rect x="30" y="48" width="7" height="12" rx="2" fill="${f('#3a6838')}"/>
      <ellipse cx="38" cy="34" rx="4" ry="2" fill="${f('#3a6838')}" transform="rotate(-30 38 34)"/>
      <ellipse cx="42" cy="36" rx="3" ry="1.5" fill="${f('#3a6838')}" transform="rotate(20 42 36)"/>
      <polygon points="52,18 62,22 56,28" fill="${f('#3a6838')}"/>
      <circle cx="48" cy="18" r="2.5" fill="${k}"/>
      <rect x="54" y="24" width="2" height="4" rx="0.5" fill="${f('#e8e8d8')}"/>
      <rect x="58" y="24" width="2" height="4" rx="0.5" fill="${f('#e8e8d8')}"/>
      <rect x="62" y="24" width="2" height="4" rx="0.5" fill="${f('#e8e8d8')}"/>
      <path d="M22 28 Q18 20 24 16" fill="none" stroke="${f('#3a6838')}" stroke-width="5" stroke-linecap="round"/>`,

    // Three horns + frill + stocky body
    triceratops: `
      <ellipse cx="30" cy="40" rx="14" ry="11" fill="${f('#6a8848')}"/>
      <ellipse cx="42" cy="28" rx="12" ry="10" fill="${f('#6a8848')}"/>
      <path d="M30 20 Q42 8 54 18 Q52 30 42 28 Q30 32 30 20" fill="${f('#8a6840')}"/>
      <polygon points="38,22 36,8 40,20" fill="${f('#d8c8a0')}"/>
      <polygon points="46,20 44,4 48,18" fill="${f('#d8c8a0')}"/>
      <polygon points="52,24 54,10 56,22" fill="${f('#d8c8a0')}"/>
      <circle cx="44" cy="24" r="2" fill="${k}"/>
      <ellipse cx="50" cy="28" rx="3" ry="2" fill="${f('#5a6838')}"/>
      <rect x="20" y="48" width="6" height="10" rx="2" fill="${f('#5a6838')}"/>
      <rect x="34" y="48" width="6" height="10" rx="2" fill="${f('#5a6838')}"/>
      <rect x="44" y="48" width="6" height="10" rx="2" fill="${f('#5a6838')}"/>`,

    // Golden mane ring + cat face
    leon: `
      <circle cx="32" cy="30" r="22" fill="${f('#d89020')}"/>
      <circle cx="32" cy="32" r="14" fill="${f('#e8a838')}"/>
      <circle cx="32" cy="32" r="10" fill="${f('#e8b848')}"/>
      <circle cx="27" cy="30" r="2.5" fill="${k}"/>
      <circle cx="37" cy="30" r="2.5" fill="${k}"/>
      <polygon points="32,34 28,38 36,38" fill="${f('#f0a0b4')}"/>
      <ellipse cx="32" cy="48" rx="12" ry="9" fill="${f('#e8a838')}"/>
      <path d="M44 48 Q56 44 52 56" fill="none" stroke="${f('#d89020')}" stroke-width="3" stroke-linecap="round"/>`,

    // Round ears + long curling tail
    mono: `
      <ellipse cx="32" cy="40" rx="13" ry="11" fill="${f('#8a6040')}"/>
      <circle cx="32" cy="26" r="11" fill="${f('#8a6040')}"/>
      <circle cx="20" cy="22" r="6" fill="${f('#705030')}"/>
      <circle cx="44" cy="22" r="6" fill="${f('#705030')}"/>
      <circle cx="20" cy="22" r="3.5" fill="${f('#a07050')}"/>
      <circle cx="44" cy="22" r="3.5" fill="${f('#a07050')}"/>
      <circle cx="27" cy="24" r="2" fill="${k}"/>
      <circle cx="37" cy="24" r="2" fill="${k}"/>
      <ellipse cx="32" cy="30" rx="4" ry="3" fill="${f('#705030')}"/>
      <circle cx="30" cy="29" r="1" fill="${k}"/>
      <circle cx="34" cy="29" r="1" fill="${k}"/>
      <path d="M44 42 Q58 30 54 52 Q50 58 44 50" fill="none" stroke="${f('#705030')}" stroke-width="5" stroke-linecap="round"/>`,
    // White body + black stripe rects + horse profile
    cebra: `
      <ellipse cx="28" cy="42" rx="14" ry="11" fill="${f('#f5f5f2')}"/>
      <ellipse cx="46" cy="30" rx="10" ry="8" fill="${f('#f5f5f2')}"/>
      <rect x="22" y="36" width="4" height="12" fill="${k}"/>
      <rect x="30" y="34" width="4" height="14" fill="${k}"/>
      <rect x="38" y="36" width="4" height="12" fill="${k}"/>
      <rect x="42" y="26" width="3" height="10" fill="${k}"/>
      <rect x="48" y="24" width="3" height="10" fill="${k}"/>
      <rect x="54" y="26" width="3" height="8" fill="${k}"/>
      <path d="M38 16 Q34 6 42 4 Q48 8 46 18" fill="${f('#1a1a1a')}"/>
      <circle cx="48" cy="26" r="2" fill="${k}"/>
      <rect x="52" y="28" width="8" height="4" rx="1.5" fill="${f('#e8e0d8')}"/>
      <rect x="20" y="50" width="5" height="10" rx="1.5" fill="${f('#2a2a2a')}"/>
      <rect x="30" y="50" width="5" height="10" rx="1.5" fill="${f('#2a2a2a')}"/>
      <rect x="38" y="50" width="5" height="10" rx="1.5" fill="${f('#2a2a2a')}"/>
      <rect x="46" y="50" width="5" height="10" rx="1.5" fill="${f('#2a2a2a')}"/>`,

    // VERY long neck + brown spots
    jirafa: `
      <rect x="28" y="6" width="8" height="36" rx="4" fill="${f('#e8c040')}"/>
      <ellipse cx="32" cy="8" rx="7" ry="6" fill="${f('#e8c040')}"/>
      <ellipse cx="32" cy="44" rx="12" ry="9" fill="${f('#e8c040')}"/>
      <ellipse cx="30" cy="16" rx="3" ry="4" fill="${f('#8a5a28')}"/>
      <ellipse cx="34" cy="24" rx="3" ry="3.5" fill="${f('#8a5a28')}"/>
      <ellipse cx="30" cy="32" rx="2.5" ry="3" fill="${f('#8a5a28')}"/>
      <ellipse cx="34" cy="40" rx="3" ry="2.5" fill="${f('#8a5a28')}"/>
      <ellipse cx="28" cy="46" rx="3" ry="2.5" fill="${f('#8a5a28')}"/>
      <ellipse cx="36" cy="48" rx="2.5" ry="2" fill="${f('#8a5a28')}"/>
      <circle cx="29" cy="8" r="1.5" fill="${k}"/>
      <circle cx="35" cy="8" r="1.5" fill="${k}"/>
      <polygon points="26,4 28,0 30,4" fill="${f('#8a5a28')}"/>
      <polygon points="34,4 36,0 38,4" fill="${f('#8a5a28')}"/>
      <rect x="24" y="52" width="5" height="10" rx="1.5" fill="${f('#8a5a28')}"/>
      <rect x="35" y="52" width="5" height="10" rx="1.5" fill="${f('#8a5a28')}"/>`,

    // BIG ears + trunk curve + tusks
    elefante: `
      <ellipse cx="32" cy="44" rx="16" ry="12" fill="${f('#8a9098')}"/>
      <circle cx="32" cy="28" r="12" fill="${f('#8a9098')}"/>
      <ellipse cx="14" cy="30" rx="10" ry="14" fill="${f('#7a8088')}"/>
      <ellipse cx="50" cy="30" rx="10" ry="14" fill="${f('#7a8088')}"/>
      <path d="M32 36 Q28 48 26 58 Q30 60 34 54 Q36 46 32 36" fill="${f('#7a8088')}"/>
      <circle cx="28" cy="24" r="2" fill="${k}"/>
      <circle cx="36" cy="24" r="2" fill="${k}"/>
      <polygon points="30,32 28,38 32,36" fill="${f('#e8e0d0')}"/>
      <polygon points="34,32 36,38 32,36" fill="${f('#e8e0d0')}"/>
      <rect x="22" y="54" width="7" height="8" rx="2" fill="${f('#6a7078')}"/>
      <rect x="35" y="54" width="7" height="8" rx="2" fill="${f('#6a7078')}"/>`,

    // Huge mouth/snout + tiny ears + dull purple-gray
    hipopotamo: `
      <ellipse cx="32" cy="42" rx="20" ry="14" fill="${f('#7a7888')}"/>
      <ellipse cx="32" cy="26" rx="14" ry="11" fill="${f('#7a7888')}"/>
      <ellipse cx="32" cy="32" rx="14" ry="8" fill="${f('#6a6878')}"/>
      <ellipse cx="18" cy="20" rx="3" ry="2" fill="${f('#6a6878')}"/>
      <ellipse cx="46" cy="20" rx="3" ry="2" fill="${f('#6a6878')}"/>
      <ellipse cx="32" cy="34" rx="10" ry="5" fill="${f('#5a5868')}"/>
      <circle cx="26" cy="32" r="2" fill="${k}"/>
      <circle cx="38" cy="32" r="2" fill="${k}"/>
      <rect x="24" y="36" width="16" height="3" rx="1" fill="${k}"/>
      <rect x="26" y="38" width="3" height="4" rx="1" fill="${f('#e8e0d8')}"/>
      <rect x="31" y="38" width="3" height="4" rx="1" fill="${f('#e8e0d8')}"/>
      <rect x="36" y="38" width="3" height="4" rx="1" fill="${f('#e8e0d8')}"/>
      <rect x="20" y="54" width="7" height="8" rx="2" fill="${f('#5a5868')}"/>
      <rect x="37" y="54" width="7" height="8" rx="2" fill="${f('#5a5868')}"/>`,
  };

  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${parts[id]}</svg>`;
}
