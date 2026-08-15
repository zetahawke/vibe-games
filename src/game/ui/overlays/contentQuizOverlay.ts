import {
  adjustDifficulty,
  coinsEarned,
  loadCurriculum,
  scoreForSubject,
  startLearningQuiz,
  submitChoice,
  type LearningQuizState,
} from '@/domain/learning';
import { makeOverlayCard } from '@/shared/overlay';
import { el } from '@/shared/dom';

/**
 * Curriculum MCQ overlay — loops until Salir.
 * Coins and score accumulate; difficulty persists via onExit.
 */
export function renderContentQuizOverlay(
  parent: HTMLElement,
  country: string,
  grade: string,
  difficulty: number,
  onExit: (coins: number, score: number, finalDifficulty: number) => void,
  onAnswerResult?: (correct: boolean) => void,
): HTMLElement {
  const { overlay, card } = makeOverlayCard('quiz-card');
  const bank = loadCurriculum(country, grade);

  let state: LearningQuizState = startLearningQuiz(bank, difficulty);
  let totalCoins = 0;
  let totalScore = 0;

  const render = () => {
    card.replaceChildren();

    const answering = state.status !== 'active';

    card.append(
      el('p', { className: 'quiz-subject' }, [state.subjectName]),
      el('h2', {}, [state.question.prompt]),
      el('p', { className: 'reward' }, [`Recompensa: ${state.reward} monedas`]),
    );

    if (totalCoins > 0 || totalScore > 0) {
      card.append(
        el('p', { className: 'quiz-earned' }, [
          `Acumulado: +${totalCoins} 🪙 +${totalScore} ⭐`,
        ]),
      );
    }

    card.append(el('p', {}, [`Intentos: ${state.attemptsLeft}`]));

    if (state.lastMessage) {
      card.append(
        el('p', {
          className: state.status === 'won' ? 'quiz-correct english-correct' : 'error',
        }, [state.lastMessage]),
      );
    }

    const opts = el('div', { className: 'english-opts' });
    state.question.options.forEach((opt, i) => {
      const b = el('button', {
        type: 'button',
        className: 'btn english-opt-btn',
        ...(answering ? { disabled: 'true' } : {}),
      }, [opt]);
      if (!answering) {
        b.addEventListener('click', () => {
          state = submitChoice(state, i);
          if (state.status === 'won') {
            totalCoins += coinsEarned(state);
            totalScore += scoreForSubject(state.subjectId);
            onAnswerResult?.(true);
            render();
            setTimeout(() => {
              state = startLearningQuiz(bank, state.difficulty);
              render();
            }, 900);
            return;
          }
          if (state.status === 'failed') {
            onAnswerResult?.(false);
            render();
            setTimeout(() => {
              state = startLearningQuiz(bank, state.difficulty);
              render();
            }, 1200);
            return;
          }
          render();
        });
      }
      opts.append(b);
    });
    card.append(opts);

    const easier = el('button', {
      type: 'button',
      className: 'btn',
      ...(answering ? { disabled: 'true' } : {}),
    }, ['Más fácil :c']);
    const harder = el('button', {
      type: 'button',
      className: 'btn',
      ...(answering ? { disabled: 'true' } : {}),
    }, ['Más difícil :D']);
    const exit = el('button', { type: 'button', className: 'btn primary' }, ['Salir']);

    if (!answering) {
      easier.addEventListener('click', () => {
        state = adjustDifficulty(state, -1);
        render();
      });
      harder.addEventListener('click', () => {
        state = adjustDifficulty(state, 1);
        render();
      });
    }
    exit.addEventListener('click', () => onExit(totalCoins, totalScore, state.difficulty));

    card.append(el('div', { className: 'btn-row quiz-actions' }, [exit, easier, harder]));
  };

  render();
  parent.append(overlay);
  return overlay;
}
