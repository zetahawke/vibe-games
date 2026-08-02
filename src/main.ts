import './styles/main.css';
import { Router } from './app/router';

const app = document.querySelector('#app');
if (!app) {
  throw new Error('No se encontró #app');
}

const router = new Router(app as HTMLElement);
router.setGameStarter((_username, _mode) => {
  router.showGameStub();
});
router.start();
