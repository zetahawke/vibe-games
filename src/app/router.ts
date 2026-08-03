import { getSession } from '@/domain/auth/auth';
import { renderHubScreen } from '@/game/ui/screens/hubScreen';
import { renderLoginScreen } from '@/game/ui/screens/loginScreen';

export class Router {
  private root: HTMLElement;
  private username: string | null = getSession();
  private onStartGame: ((username: string, mode: 'new' | 'continue') => void) | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  setGameStarter(handler: (username: string, mode: 'new' | 'continue') => void): void {
    this.onStartGame = handler;
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
      () => this.showLogin(),
    );
  }
}
