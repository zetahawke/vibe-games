import { describe, expect, it } from 'vitest';
import { ANIMAL_IDS } from '@/domain/animals/catalog';
import { animalPhotoUrl, animalSoundUrl } from '@/domain/animals/art';

describe('animal asset URLs', () => {
  it('points realistic photos at /animals/images/<id>.png', () => {
    expect(animalPhotoUrl('perro')).toBe('/animals/images/perro.png');
  });

  it('points spoken names at /animals/sounds/<id>.mp3', () => {
    expect(animalSoundUrl('hipopotamo')).toBe('/animals/sounds/hipopotamo.mp3');
  });

  it('covers every catalog animal', () => {
    for (const id of ANIMAL_IDS) {
      expect(animalPhotoUrl(id)).toBe(`/animals/images/${id}.png`);
      expect(animalSoundUrl(id)).toBe(`/animals/sounds/${id}.mp3`);
    }
  });
});
