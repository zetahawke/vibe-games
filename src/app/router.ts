import { getSession } from '@/domain/auth/auth';
import type { DropMode, GraphicsStyle } from '@/domain/animals';
import type { IdentifyTheme } from '@/domain/identify';
import { renderHubScreen } from '@/game/ui/screens/hubScreen';
import { renderLoginScreen } from '@/game/ui/screens/loginScreen';

export class Router {
  private root: HTMLElement;
  private username: string | null = getSession();
  private onStartGame: ((username: string, mode: 'new' | 'continue') => void) | null = null;
  private onStartAnimals:
    | ((username: string, dropMode: DropMode, graphicsStyle: GraphicsStyle) => void)
    | null = null;
  private onStartIdentify:
    | ((username: string, theme: IdentifyTheme, dropMode: DropMode) => void)
    | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  setGameStarter(handler: (username: string, mode: 'new' | 'continue') => void): void {
    this.onStartGame = handler;
  }

  setAnimalsStarter(
    handler: (username: string, dropMode: DropMode, graphicsStyle: GraphicsStyle) => void,
  ): void {
    this.onStartAnimals = handler;
  }

  setIdentifyStarter(
    handler: (username: string, theme: IdentifyTheme, dropMode: DropMode) => void,
  ): void {
    this.onStartIdentify = handler;
  }

  start(): void {
    if (this.username) this.showHub();
    else this.showLogin();
  }

  showLogin(): void {
    this.username = null;
    renderLoginScreen(this.root, (username) => {
      this.username = username;
      this.showHub();
    });
  }

  showHub(): void {
    if (!this.username) {
      this.showLogin();
      return;
    }
    const user = this.username;
    renderHubScreen(
      this.root,
      user,
      (mode) => {
        this.onStartGame?.(user, mode);
      },
      (dropMode, graphicsStyle) => {
        this.onStartAnimals?.(user, dropMode, graphicsStyle);
      },
      (theme, dropMode) => {
        this.onStartIdentify?.(user, theme, dropMode);
      },
      () => this.showLogin(),
    );
  }
}
