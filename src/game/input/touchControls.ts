import type { InputManager } from './InputManager';
import {
  clearTouchGesture,
  createTouchGestureState,
  handleTouchDown,
  handleTouchEnd,
  handleTouchMove,
} from './touchGesture';

export interface TouchControlsHandle {
  dispose: () => void;
}

type TouchInput = Pick<InputManager, 'setTouchMove' | 'setTouchLook'>;

export function bindTouchControls(opts: {
  pad: HTMLElement;
  stickBase: HTMLElement;
  stickKnob: HTMLElement;
  input: TouchInput;
  isBlocked: () => boolean;
}): TouchControlsHandle {
  const state = createTouchGestureState();
  const { pad, stickBase, stickKnob, input, isBlocked } = opts;

  const hideStick = () => {
    stickBase.style.display = 'none';
    stickKnob.style.transform = 'translate(-50%, -50%)';
  };

  const forceClear = () => {
    const hadMove = state.movePointerId !== null;
    clearTouchGesture(state);
    if (hadMove) {
      input.setTouchMove(0, 0);
      hideStick();
    }
  };

  const onDown = (e: PointerEvent) => {
    if (isBlocked()) {
      forceClear();
      return;
    }
    e.preventDefault();
    const rect = pad.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const result = handleTouchDown(state, e.pointerId, x, y);
    if (result.action === 'ignore') return;
    pad.setPointerCapture(e.pointerId);
    if (result.action === 'startMove') {
      input.setTouchMove(0, 0);
      stickBase.style.left = `${result.originX}px`;
      stickBase.style.top = `${result.originY}px`;
      stickBase.style.display = 'block';
      stickKnob.style.transform = 'translate(-50%, -50%)';
    }
  };

  const onMove = (e: PointerEvent) => {
    if (isBlocked()) {
      forceClear();
      return;
    }
    const rect = pad.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const result = handleTouchMove(state, e.pointerId, x, y);
    if (result.action === 'move') {
      stickKnob.style.transform =
        `translate(calc(-50% + ${result.knobDx}px), calc(-50% + ${result.knobDy}px))`;
      input.setTouchMove(result.nx, result.ny);
    } else if (result.action === 'look') {
      input.setTouchLook(result.dx, result.dy);
    }
  };

  const onEnd = (e: PointerEvent) => {
    const result = handleTouchEnd(state, e.pointerId);
    if (result.action === 'endMove') {
      input.setTouchMove(0, 0);
      hideStick();
    }
  };

  pad.addEventListener('pointerdown', onDown);
  pad.addEventListener('pointermove', onMove);
  pad.addEventListener('pointerup', onEnd);
  pad.addEventListener('pointercancel', onEnd);
  pad.addEventListener('lostpointercapture', onEnd);

  return {
    dispose: () => {
      forceClear();
      pad.removeEventListener('pointerdown', onDown);
      pad.removeEventListener('pointermove', onMove);
      pad.removeEventListener('pointerup', onEnd);
      pad.removeEventListener('pointercancel', onEnd);
      pad.removeEventListener('lostpointercapture', onEnd);
    },
  };
}
