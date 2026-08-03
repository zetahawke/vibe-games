export type AnimalId =
  | 'perro'
  | 'gato'
  | 'pajaro'
  | 'pez'
  | 'vaca'
  | 'cerdo'
  | 'conejo'
  | 'pato'
  | 'delfin'
  | 'tiburon'
  | 'tortuga'
  | 'toro'
  | 'caballo'
  | 'tiranosaurio'
  | 'triceratops'
  | 'leon'
  | 'mono'
  | 'cebra'
  | 'jirafa'
  | 'elefante'
  | 'hipopotamo';

export type AnimalGroup = 'casa' | 'mar' | 'campo' | 'dinosaurios' | 'jungla';

export const ANIMAL_IDS: AnimalId[] = [
  'perro',
  'gato',
  'pajaro',
  'pez',
  'vaca',
  'cerdo',
  'conejo',
  'pato',
  'delfin',
  'tiburon',
  'tortuga',
  'toro',
  'caballo',
  'tiranosaurio',
  'triceratops',
  'leon',
  'mono',
  'cebra',
  'jirafa',
  'elefante',
  'hipopotamo',
];

const NAMES: Record<AnimalId, string> = {
  perro: 'Perro',
  gato: 'Gato',
  pajaro: 'Pájaro',
  pez: 'Pez',
  vaca: 'Vaca',
  cerdo: 'Cerdo',
  conejo: 'Conejo',
  pato: 'Pato',
  delfin: 'Delfín',
  tiburon: 'Tiburón',
  tortuga: 'Tortuga',
  toro: 'Toro',
  caballo: 'Caballo',
  tiranosaurio: 'Tiranosaurio',
  triceratops: 'Triceratops',
  leon: 'León',
  mono: 'Mono',
  cebra: 'Cebra',
  jirafa: 'Jirafa',
  elefante: 'Elefante',
  hipopotamo: 'Hipopótamo',
};

const GROUPS: Record<AnimalId, AnimalGroup> = {
  perro: 'casa',
  gato: 'casa',
  pajaro: 'casa',
  pez: 'mar',
  vaca: 'campo',
  cerdo: 'campo',
  conejo: 'casa',
  pato: 'casa',
  delfin: 'mar',
  tiburon: 'mar',
  tortuga: 'mar',
  toro: 'campo',
  caballo: 'campo',
  tiranosaurio: 'dinosaurios',
  triceratops: 'dinosaurios',
  leon: 'jungla',
  mono: 'jungla',
  cebra: 'jungla',
  jirafa: 'jungla',
  elefante: 'jungla',
  hipopotamo: 'jungla',
};

export function animalName(id: AnimalId): string {
  return NAMES[id];
}

export function animalGroup(id: AnimalId): AnimalGroup {
  return GROUPS[id];
}
