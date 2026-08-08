import './styles/main.css';
import { Router } from './app/router';
import { AnimalsSession } from './game/animals/AnimalsSession';
import { IdentifySession } from './game/identify/IdentifySession';
import { GameSession } from './game/GameSession';
import { OnlineGameSession } from './game/OnlineGameSession';

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

router.setAnimalsStarter((username, dropMode, graphicsStyle) => {
  new AnimalsSession(root, username, dropMode, graphicsStyle, () => {
    router.showHub();
  });
});

router.setIdentifyStarter((username, theme, dropMode) => {
  new IdentifySession(root, username, theme, dropMode, () => {
    router.showHub();
  });
});

router.setOnlineStarter((username, sessionId, code, playerId, sessionToken, playerCount, isHost) => {
  new OnlineGameSession(root, username, sessionId, code, playerId, sessionToken, playerCount, isHost, () => {
    router.showHub();
  });
});

router.start();
