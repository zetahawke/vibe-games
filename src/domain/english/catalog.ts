export interface EnglishQuestion {
  prompt: string;
  options: readonly string[];
  answer: number; // index into options
}

export type EnglishGrade = '7th';

const QUESTIONS_7TH: EnglishQuestion[] = [
  { prompt: '¿Cómo se dice: perro?', options: ['Dog', 'Cat', 'Wolf'], answer: 0 },
  { prompt: '¿Cómo se dice: gato?', options: ['Cat', 'Dog', 'Bird'], answer: 0 },
  { prompt: '¿Cómo se dice: casa?', options: ['Tree', 'Car', 'House'], answer: 2 },
  { prompt: '¿Cómo se dice: agua?', options: ['Fire', 'Water', 'Earth'], answer: 1 },
  { prompt: '¿Cómo se dice: libro?', options: ['Book', 'Box', 'Board'], answer: 0 },
  { prompt: '¿Cómo se dice: manzana?', options: ['Banana', 'Orange', 'Apple'], answer: 2 },
  { prompt: '¿Cómo se dice: escuela?', options: ['School', 'Store', 'Street'], answer: 0 },
  { prompt: '¿Cómo se dice: amigo?', options: ['Enemy', 'Friend', 'Family'], answer: 1 },
  { prompt: '¿Cómo se dice: mesa?', options: ['Chair', 'Table', 'Door'], answer: 1 },
  { prompt: '¿Cómo se dice: sol?', options: ['Moon', 'Star', 'Sun'], answer: 2 },
  { prompt: '¿Cómo se dice: árbol?', options: ['Flower', 'Tree', 'Grass'], answer: 1 },
  { prompt: '¿Cómo se dice: pelota?', options: ['Ball', 'Bat', 'Net'], answer: 0 },
  { prompt: '¿Cómo se dice: rojo?', options: ['Blue', 'Green', 'Red'], answer: 2 },
  { prompt: '¿Cómo se dice: uno?', options: ['Two', 'One', 'Three'], answer: 1 },
  { prompt: '¿Cómo se dice: madre?', options: ['Father', 'Mother', 'Sister'], answer: 1 },
  { prompt: '¿Cómo se dice: padre?', options: ['Father', 'Mother', 'Brother'], answer: 0 },
  { prompt: '¿Cómo se dice: ciudad?', options: ['Town', 'City', 'Country'], answer: 1 },
  { prompt: '¿Cómo se dice: leche?', options: ['Juice', 'Water', 'Milk'], answer: 2 },
  { prompt: '¿Cómo se dice: grande?', options: ['Small', 'Big', 'Tall'], answer: 1 },
  { prompt: '¿Cómo se dice: bueno?', options: ['Bad', 'Good', 'Better'], answer: 1 },
  { prompt: '¿Cómo se dice: niño?', options: ['Girl', 'Boy', 'Baby'], answer: 1 },
  { prompt: '¿Cómo se dice: azul?', options: ['Red', 'Blue', 'Yellow'], answer: 1 },
  { prompt: '¿Cómo se dice: silla?', options: ['Table', 'Chair', 'Sofa'], answer: 1 },
  { prompt: '¿Cómo se dice: lluvia?', options: ['Snow', 'Wind', 'Rain'], answer: 2 },
  { prompt: '¿Cómo se dice: pan?', options: ['Bread', 'Milk', 'Rice'], answer: 0 },
];

const GRADE_POOLS: Record<EnglishGrade, EnglishQuestion[]> = {
  '7th': QUESTIONS_7TH,
};

export function pickEnglishQuestion(grade: EnglishGrade, rng = Math.random): EnglishQuestion {
  const pool = GRADE_POOLS[grade];
  return pool[Math.floor(rng() * pool.length)]!;
}

export const ENGLISH_REWARD = 5;
