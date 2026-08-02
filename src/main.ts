import './styles/main.css';
import { Router } from './app/router';
import { GameSession } from './game/GameSession';

const app = document.querySelector('#app');
if (!app) {
  throw new Error('No se encontró #app');
}

const root = app as HTMLElement;
const router = new Router(root);

router.setGameStarter((username, mode) => {
  new GameSession(root, username, mode, () => {
    router.showHub();
  });
});

router.start();
