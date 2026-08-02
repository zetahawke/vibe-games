import { getSession } from '../auth/auth';
import { renderHubScreen } from '../ui/hubScreen';
import { renderLoginScreen } from '../ui/loginScreen';
import { clear, el } from '../ui/dom';

export type Screen = 'login' | 'hub' | 'game';

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

  showGameStub(): void {
    clear(this.root);
    const back = el('button', { type: 'button', className: 'btn' }, ['Volver al hub']);
    back.addEventListener('click', () => this.showHub());
    this.root.append(
      el('section', { className: 'screen', id: 'game-root' }, [
        el('p', {}, ['Pronto']),
        back,
      ]),
    );
  }
}
