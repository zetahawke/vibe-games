import { describe, expect, it } from 'vitest';
import {
  glyphLabel,
  poolForTheme,
  spokenLabel,
} from '@/domain/identify/catalog';

describe('identify catalog', () => {
  it('vocales pool is AEIOU', () => {
    expect(poolForTheme('vocales')).toEqual(['A', 'E', 'I', 'O', 'U']);
  });

  it('numeros pool is 1-10', () => {
    expect(poolForTheme('numeros')).toEqual([
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    ]);
  });

  it('abecedario has 27 letters including Ñ', () => {
    const p = poolForTheme('abecedario');
    expect(p).toHaveLength(27);
    expect(p).toContain('Ñ');
    expect(p[0]).toBe('A');
    expect(p[p.length - 1]).toBe('Z');
  });

  it('spoken labels', () => {
    expect(spokenLabel('vocales', 'A')).toBe('a');
    expect(spokenLabel('numeros', '1')).toBe('uno');
    expect(spokenLabel('numeros', '10')).toBe('diez');
    expect(spokenLabel('abecedario', 'J')).toBe('jota');
    expect(spokenLabel('abecedario', 'W')).toBe('uve doble');
    expect(spokenLabel('abecedario', 'Ñ')).toBe('eñe');
  });

  it('glyph labels', () => {
    expect(glyphLabel('A')).toBe('A');
    expect(glyphLabel('10')).toBe('10');
  });
});
