import { MathTopic } from '@/config/gameConfig';
import type { ChileGrade } from '@/domain/profile/profile';
import { clampDifficulty } from '@/shared/math';

export interface MathQuestion {
  prompt: string;
  answer: number;
  difficulty: number;
  topic: MathTopic;
}

type Rng = () => number;

function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function pickTopic(topic: MathTopic, rng: Rng, grade?: ChileGrade): Exclude<MathTopic, 'mixed'> {
  if (topic !== 'mixed') {
    if (grade === '2do' && (topic === 'multiplications' || topic === 'divisions')) {
      return rng() < 0.5 ? 'additions' : 'subtractions';
    }
    return topic;
  }
  const options: Exclude<MathTopic, 'mixed'>[] = grade === '2do'
    ? ['additions', 'subtractions']
    : ['additions', 'subtractions', 'multiplications', 'divisions'];
  return options[randInt(rng, 0, options.length - 1)];
}

function makeAdditions(difficulty: number, rng: Rng, grade?: ChileGrade): { expr: string; answer: number } {
  if (grade === '2do') {
    const max = difficulty === 1 ? 20 : difficulty === 2 ? 35 : 50;
    const a = randInt(rng, 1, max);
    const b = randInt(rng, 1, max);
    return { expr: `${a} + ${b}`, answer: a + b };
  }
  if (difficulty === 1) {
    const a = randInt(rng, 1, 10);
    const b = randInt(rng, 1, 10);
    return { expr: `${a} + ${b}`, answer: a + b };
  }
  if (difficulty === 2) {
    const a = randInt(rng, 1, 20);
    const b = randInt(rng, 1, 20);
    const c = randInt(rng, 1, 20);
    return { expr: `${a} + ${b} + ${c}`, answer: a + b + c };
  }
  const count = randInt(rng, 3, 4);
  const nums = Array.from({ length: count }, () => randInt(rng, 1, 50));
  return { expr: nums.join(' + '), answer: nums.reduce((s, n) => s + n, 0) };
}

function makeSubtractions(difficulty: number, rng: Rng, grade?: ChileGrade): { expr: string; answer: number } {
  const max = grade === '2do'
    ? (difficulty === 1 ? 20 : difficulty === 2 ? 35 : 50)
    : (difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50);
  let a = randInt(rng, 1, max);
  let b = randInt(rng, 1, max);
  if (b > a) [a, b] = [b, a];
  if (difficulty >= 3 && grade !== '2do') {
    const c = randInt(rng, 0, Math.min(b, 10));
    return { expr: `${a} - ${b} - ${c}`, answer: a - b - c };
  }
  return { expr: `${a} - ${b}`, answer: a - b };
}

function makeMultiplications(difficulty: number, rng: Rng): { expr: string; answer: number } {
  if (difficulty === 1) {
    const a = randInt(rng, 2, 5);
    const b = randInt(rng, 2, 10);
    return { expr: `${a} × ${b}`, answer: a * b };
  }
  if (difficulty === 2) {
    const a = randInt(rng, 2, 10);
    const b = randInt(rng, 2, 10);
    return { expr: `${a} × ${b}`, answer: a * b };
  }
  const a = randInt(rng, 6, 12);
  const b = randInt(rng, 6, 12);
  return { expr: `${a} × ${b}`, answer: a * b };
}

function makeDivisions(difficulty: number, rng: Rng): { expr: string; answer: number } {
  const maxQ = difficulty === 1 ? 5 : difficulty === 2 ? 10 : 12;
  const maxB = difficulty === 1 ? 5 : difficulty === 2 ? 10 : 12;
  const q = randInt(rng, 1, maxQ);
  const b = randInt(rng, 2, maxB);
  const a = b * q;
  return { expr: `${a} ÷ ${b}`, answer: q };
}

export function generateQuestion(
  topic: MathTopic,
  difficulty: number,
  rng: Rng = Math.random,
  grade?: ChileGrade,
): MathQuestion {
  const d = clampDifficulty(difficulty);
  const chosen = pickTopic(topic, rng, grade);
  let built: { expr: string; answer: number };
  switch (chosen) {
    case 'additions':
      built = makeAdditions(d, rng, grade);
      break;
    case 'subtractions':
      built = makeSubtractions(d, rng, grade);
      break;
    case 'multiplications':
      built = makeMultiplications(d, rng);
      break;
    case 'divisions':
      built = makeDivisions(d, rng);
      break;
  }
  return {
    prompt: `¿Cuánto es ${built.expr}?`,
    answer: built.answer,
    difficulty: d,
    topic: chosen,
  };
}
