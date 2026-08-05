import { MathTopic } from '@/config/gameConfig';
import { scoreForQuiz } from '@/domain/score';
import {
  adjustDifficulty,
  coinsEarned,
  QuizState,
  startQuiz,
  submitAnswer,
} from '@/domain/quiz/quizSession';
import { el } from '@/shared/dom';

/**
 * Quiz overlay that loops questions continuously.
 * Coins and score accumulate with each correct answer.
 * Only "Salir" exits back to the shop, passing the totals.
 */
export function renderQuizOverlay(
  parent: HTMLElement,
  topic: MathTopic,
  difficulty: number,
  onExit: (coins: number, score: number, finalDifficulty: number) => void,
): HTMLElement {
  const overlay = el('div', { className: 'overlay' });
  const card = el('div', { className: 'overlay-card quiz-card' });
  overlay.append(card);

  let state: QuizState = startQuiz(topic, difficulty);
  let entry = '';
  let totalCoins = 0;
  let totalScore = 0;

  const render = () => {
    card.replaceChildren();

    const prompt = el('h2', {}, [state.question.prompt]);
    const reward = el('p', { className: 'reward' }, [
      `Recompensa: ${state.reward} monedas`,
    ]);
    const earned = totalCoins > 0
      ? el('p', { className: 'quiz-earned' }, [`Acumulado: +${totalCoins} 🪙 +${totalScore} ⭐`])
      : el('p', {});
    const attempts = el('p', {}, [`Intentos: ${state.attemptsLeft}`]);
    const message = el('p', { className: state.status === 'won' ? 'quiz-correct' : 'error' }, [state.lastMessage]);
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
            totalCoins += coinsEarned(state);
            totalScore += scoreForQuiz(state.question.topic);
            render();
            // Auto-advance to next question after a short pause
            setTimeout(() => {
              state = startQuiz(topic, state.difficulty);
              entry = '';
              render();
            }, 900);
            return;
          } else if (state.status === 'failed') {
            render();
            // Auto-advance after failure too
            setTimeout(() => {
              state = startQuiz(topic, state.difficulty);
              entry = '';
              render();
            }, 1200);
            return;
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
    exit.addEventListener('click', () => onExit(totalCoins, totalScore, state.difficulty));

    // Disable pad buttons briefly after answering while auto-advancing
    const answering = state.status !== 'active';
    pad.querySelectorAll('button').forEach((b) => {
      (b as HTMLButtonElement).disabled = answering;
    });

    card.append(
      prompt,
      reward,
      earned,
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
