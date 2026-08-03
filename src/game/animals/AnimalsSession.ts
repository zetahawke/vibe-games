import {
  animalArtHtml,
  animalName,
  pickRound,
  type DropMode,
  type GraphicsStyle,
} from '@/domain/animals';
import { MatchSession } from '@/game/match/MatchSession';
import type { MatchItem } from '@/game/match/types';

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
        const photo = graphicsStyle === 'realista';
        const classes = ['match-art', 'animal-art'];
        if (photo) classes.push('animal-art-photo');
        if (photo && variant === 'shadow') classes.push('animal-art-shadow');
        return {
          className: classes.join(' '),
          html: animalArtHtml(item.id as Parameters<typeof animalArtHtml>[0], graphicsStyle, variant),
        };
      },
      onExit,
    });
  }

  dispose(): void {
    this.match.dispose();
  }
}
