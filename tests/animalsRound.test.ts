import { describe, expect, it } from 'vitest';
import { animalName } from '@/domain/animals/catalog';
import { ANIMAL_IDS, pickRound } from '@/domain/animals/round';

describe('pickRound', () => {
  it('returns 3 or 4 unique catalog ids', () => {
    for (let i = 0; i < 40; i++) {
      const r = pickRound();
      expect([3, 4]).toContain(r.length);
      expect(new Set(r).size).toBe(r.length);
      for (const id of r) expect(ANIMAL_IDS).toContain(id);
    }
  });

  it('can force length via rng sequence', () => {
    let n = 0;
    const values = [0.1, 0.0, 0.1, 0.2, 0.3];
    const r = pickRound(() => values[n++] ?? 0.5);
    expect(r.length).toBe(3);
  });
});

describe('catalog', () => {
  it('names perro in Spanish', () => {
    expect(animalName('perro')).toBe('Perro');
  });

  it('includes jungle, sea, farm and dinosaur animals', () => {
    expect(ANIMAL_IDS).toEqual(expect.arrayContaining([
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
    ]));
    expect(ANIMAL_IDS.length).toBeGreaterThanOrEqual(21);
    expect(animalName('jirafa')).toBe('Jirafa');
    expect(animalName('tiranosaurio')).toBe('Tiranosaurio');
  });
});
