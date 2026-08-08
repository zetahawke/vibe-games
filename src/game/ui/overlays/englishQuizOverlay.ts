import { ENGLISH_REWARD, pickEnglishQuestion, type EnglishGrade, type EnglishQuestion } from '@/domain/english';
import { ENGLISH_QUIZ_SCORE } from '@/domain/score';
import { makeOverlayCard } from '@/shared/overlay';
import { el } from '@/shared/dom';

export function renderEnglishQuizOverlay(
  parent: HTMLElement,
  grade: EnglishGrade,
  onWin: (coins: number, score: number) => void,
  onClose: () => void,
): HTMLElement {
  const { overlay, card } = makeOverlayCard('quiz-card');

  let question: EnglishQuestion = pickEnglishQuestion(grade);
  let message = '';
  let answered = false;

  const render = () => {
    card.replaceChildren();

    card.append(
      el('h2', {}, [question.prompt]),
      el('p', { className: 'reward' }, [`Recompensa: ${ENGLISH_REWARD} monedas`]),
    );

    if (message) {
      card.append(el('p', { className: answered ? 'english-correct' : 'error' }, [message]));
    }

    if (!answered) {
      const opts = el('div', { className: 'english-opts' });
      question.options.forEach((opt, i) => {
        const b = el('button', { type: 'button', className: 'btn english-opt-btn' }, [opt]);
        b.addEventListener('click', () => {
          if (i === question.answer) {
            answered = true;
            message = '¡Correcto! 🎉';
            render();
            setTimeout(() => onWin(ENGLISH_REWARD, ENGLISH_QUIZ_SCORE), 900);
          } else {
            message = `Incorrecto. La respuesta era: ${question.options[question.answer]}`;
            question = pickEnglishQuestion(grade);
            answered = false;
            render();
          }
        });
        opts.append(b);
      });
      card.append(opts);
    }

    const exit = el('button', { type: 'button', className: 'btn primary', style: 'margin-top:.75rem' }, [
      'Salir',
    ]);
    exit.addEventListener('click', onClose);
    card.append(exit);
  };

  render();
  parent.append(overlay);
  return overlay;
}
