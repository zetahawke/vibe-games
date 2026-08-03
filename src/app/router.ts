import { getSession } from '@/domain/auth/auth';
import type { DropMode } from '@/domain/animals';
import { renderHubScreen } from '@/game/ui/screens/hubScreen';
import { renderLoginScreen } from '@/game/ui/screens/loginScreen';

export class Router {
  private root: HTMLElement;
  private username: string | null = getSession();
  private onStartGame: ((username: string, mode: 'new' | 'continue') => void) | null = null;
  private onStartAnimals: ((username: string, mode: DropMode) => void) | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  setGameStarter(handler: (username: string, mode: 'new' | 'continue') => void): void {
    this.onStartGame = handler;
  }

  setAnimalsStarter(handler: (username: string, mode: DropMode) => void): void {
    this.onStartAnimals = handler;
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
      (dropMode) => {
        this.onStartAnimals?.(user, dropMode);
      },
      () => this.showLogin(),
    );
  }
}
