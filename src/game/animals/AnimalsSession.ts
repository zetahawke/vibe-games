import {
  animalArtHtml,
  animalName,
  animalSoundUrl,
  pickRound,
  type AnimalId,
  type DropMode,
  type GraphicsStyle,
} from '@/domain/animals';
import { MatchSession } from '@/game/match/MatchSession';
import type { MatchItem } from '@/game/match/types';
import { speakClip } from '@/shared/speech';

export class AnimalsSession {
  private match: MatchSession;

  constructor(
    root: HTMLElement,
    _username: string,
    dropMode: DropMode,
    graphicsStyle: GraphicsStyle,
    onExit: () => void,
  ) {
    this.match = new MatchSession({
      root,
      title: 'Animales',
      screenClassName: 'animals-screen',
      dropMode,
      celebrateMessage: 'Todos los animales encontraron su sombra.',
      pickRound: () =>
        pickRound().map(
          (id): MatchItem => ({
            id,
            label: animalName(id),
          }),
        ),
      renderArt: (item, variant) => {
        const photoPiece = graphicsStyle === 'realistic' && variant === 'color';
        const classes = ['match-art', 'animal-art'];
        if (photoPiece) classes.push('animal-art-photo');
        return {
          className: classes.join(' '),
          html: animalArtHtml(item.id as Parameters<typeof animalArtHtml>[0], graphicsStyle, variant),
        };
      },
      onPick: (item) => {
        void speakClip(animalSoundUrl(item.id as AnimalId), item.label);
      },
      onExit,
    });
  }

  dispose(): void {
    this.match.dispose();
  }
}
