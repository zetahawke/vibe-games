export type AnimalId =
  | 'perro'
  | 'gato'
  | 'pajaro'
  | 'pez'
  | 'vaca'
  | 'cerdo'
  | 'conejo'
  | 'pato';

export const ANIMAL_IDS: AnimalId[] = [
  'perro',
  'gato',
  'pajaro',
  'pez',
  'vaca',
  'cerdo',
  'conejo',
  'pato',
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
};

export function animalName(id: AnimalId): string {
  return NAMES[id];
}
