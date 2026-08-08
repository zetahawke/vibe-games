import './styles/main.css';
import { renderAdminScreen } from '@/game/ui/screens/adminScreen';

const app = document.querySelector('#app');
if (!app) {
  throw new Error('No se encontró #app');
}

renderAdminScreen(app as HTMLElement, () => {
  window.location.href = '/';
});
