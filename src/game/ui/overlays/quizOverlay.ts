import { MathTopic } from '@/config/gameConfig';
import {
  adjustDifficulty,
  coinsEarned,
  QuizState,
  startQuiz,
  submitAnswer,
} from '@/domain/quiz/quizSession';
import { el } from '@/shared/dom';

export function renderQuizOverlay(
  parent: HTMLElement,
  topic: MathTopic,
  difficulty: number,
  onWin: (coins: number, difficulty: number, questionTopic: MathTopic) => void,
  onClose: (difficulty: number) => void,
): HTMLElement {
  const overlay = el('div', { className: 'overlay' });
  const card = el('div', { className: 'overlay-card quiz-card' });
  overlay.append(card);

  let state: QuizState = startQuiz(topic, difficulty);
  let entry = '';

  const render = () => {
    card.replaceChildren();
    const prompt = el('h2', {}, [state.question.prompt]);
    const reward = el('p', { className: 'reward' }, [
      `Recompensa: ${state.reward} monedas`,
    ]);
    const attempts = el('p', {}, [`Intentos: ${state.attemptsLeft}`]);
    const message = el('p', { className: 'error' }, [state.lastMessage]);
    const display = el('div', { className: 'quiz-entry' }, [entry || ' ']);

    const pad = el('div', { className: 'numpad' });
    for (const label of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Borrar', '0', 'OK']) {
      const b = el('button', { type: 'button', className: 'btn num-btn' }, [label]);
      b.addEventListener('click', () => {
        if (state.status !== 'active') return;
        if (label === 'Borrar') {
          entry = entry.slice(0, -1);
        } else if (label === 'OK') {
          if (entry === '' || entry === '-') return;
          state = submitAnswer(state, Number(entry));
          entry = '';
          if (state.status === 'won') {
            onWin(coinsEarned(state), state.difficulty, state.question.topic);
          }
        } else {
          entry += label;
        }
        render();
      });
      pad.append(b);
    }

    const easier = el('button', { type: 'button', className: 'btn' }, ['Más fácil :c']);
    const harder = el('button', { type: 'button', className: 'btn' }, ['Más difícil :D']);
    const exit = el('button', { type: 'button', className: 'btn primary' }, ['Salir']);

    easier.addEventListener('click', () => {
      state = adjustDifficulty(state, -1);
      entry = '';
      render();
    });
    harder.addEventListener('click', () => {
      state = adjustDifficulty(state, 1);
      entry = '';
      render();
    });
    exit.addEventListener('click', () => onClose(state.difficulty));

    card.append(
      prompt,
      reward,
      attempts,
      message,
      display,
      pad,
      el('div', { className: 'btn-row quiz-actions' }, [exit, easier, harder]),
    );
  };

  render();
  parent.append(overlay);
  return overlay;
}
