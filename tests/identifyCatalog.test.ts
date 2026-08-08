import { describe, expect, it } from 'vitest';
import {
  glyphLabel,
  poolForTheme,
  spokenLabel,
} from '@/domain/identify/catalog';

describe('identify catalog', () => {
  it('vowels pool is AEIOU', () => {
    expect(poolForTheme('vowels')).toEqual(['A', 'E', 'I', 'O', 'U']);
  });

  it('numbers pool is 1-10', () => {
    expect(poolForTheme('numbers')).toEqual([
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    ]);
  });

  it('alphabet has 27 letters including Ñ', () => {
    const p = poolForTheme('alphabet');
    expect(p).toHaveLength(27);
    expect(p).toContain('Ñ');
    expect(p[0]).toBe('A');
    expect(p[p.length - 1]).toBe('Z');
  });

  it('spoken labels', () => {
    expect(spokenLabel('vowels',   'A')).toBe('a');
    expect(spokenLabel('numbers',  '1')).toBe('uno');
    expect(spokenLabel('numbers',  '10')).toBe('diez');
    expect(spokenLabel('alphabet', 'J')).toBe('jota');
    expect(spokenLabel('alphabet', 'W')).toBe('uve doble');
    expect(spokenLabel('alphabet', 'Ñ')).toBe('eñe');
  });

  it('glyph labels', () => {
    expect(glyphLabel('A')).toBe('A');
    expect(glyphLabel('10')).toBe('10');
  });
});
