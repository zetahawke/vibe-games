import {
  glyphLabel,
  pickIdentifyRound,
  spokenLabel,
  themeTitle,
  type IdentifyTheme,
} from '@/domain/identify';
import type { DropMode } from '@/domain/animals/dropRules';
import { MatchSession } from '@/game/match/MatchSession';
import type { MatchItem } from '@/game/match/types';
import { speak } from '@/shared/speech';

export class IdentifySession {
  private match: MatchSession;

  constructor(
    root: HTMLElement,
    _username: string,
    theme: IdentifyTheme,
    dropMode: DropMode,
    onExit: () => void,
  ) {
    this.match = new MatchSession({
      root,
      title: `Identificar · ${themeTitle(theme)}`,
      screenClassName: 'identify-screen',
      dropMode,
      celebrateMessage: '¡Todo identificado!',
      pickRound: () =>
        pickIdentifyRound(theme).map(
          (id): MatchItem => ({
            id,
            label: glyphLabel(id),
          }),
        ),
      renderArt: (item, variant) => {
        const classes = ['match-art', 'identify-art'];
        if (variant === 'shadow') classes.push('identify-art-shadow');
        return {
          className: classes.join(' '),
          html: `<span class="identify-glyph">${glyphLabel(item.id)}</span>`,
        };
      },
      onPick: (item) => {
        speak(spokenLabel(theme, item.id));
      },
      onExit,
    });
  }

  dispose(): void {
    this.match.dispose();
  }
}
