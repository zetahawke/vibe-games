export const STICK_RADIUS = 52;

export interface TouchGestureState {
  movePointerId: number | null;
  lookPointerId: number | null;
  originX: number;
  originY: number;
  lookLastX: number;
  lookLastY: number;
}

export type DownResult =
  | { action: 'ignore' }
  | { action: 'startMove'; originX: number; originY: number }
  | { action: 'startLook'; x: number; y: number };

export type MoveResult =
  | { action: 'none' }
  | { action: 'move'; nx: number; ny: number; knobDx: number; knobDy: number }
  | { action: 'look'; dx: number; dy: number };

export type EndResult =
  | { action: 'none' }
  | { action: 'endMove' }
  | { action: 'endLook' };

export function createTouchGestureState(): TouchGestureState {
  return {
    movePointerId: null,
    lookPointerId: null,
    originX: 0,
    originY: 0,
    lookLastX: 0,
    lookLastY: 0,
  };
}

export function clearTouchGesture(state: TouchGestureState): void {
  state.movePointerId = null;
  state.lookPointerId = null;
}

export function handleTouchDown(
  state: TouchGestureState,
  pointerId: number,
  x: number,
  y: number,
): DownResult {
  if (state.movePointerId === null) {
    state.movePointerId = pointerId;
    state.originX = x;
    state.originY = y;
    return { action: 'startMove', originX: x, originY: y };
  }
  if (state.lookPointerId === null && pointerId !== state.movePointerId) {
    state.lookPointerId = pointerId;
    state.lookLastX = x;
    state.lookLastY = y;
    return { action: 'startLook', x, y };
  }
  return { action: 'ignore' };
}

export function handleTouchMove(
  state: TouchGestureState,
  pointerId: number,
  x: number,
  y: number,
): MoveResult {
  if (pointerId === state.movePointerId) {
    let dx = x - state.originX;
    let dy = y - state.originY;
    const len = Math.hypot(dx, dy) || 1;
    if (len > STICK_RADIUS) {
      dx = (dx / len) * STICK_RADIUS;
      dy = (dy / len) * STICK_RADIUS;
    }
    return {
      action: 'move',
      nx: dx / STICK_RADIUS,
      ny: dy / STICK_RADIUS,
      knobDx: dx,
      knobDy: dy,
    };
  }
  if (pointerId === state.lookPointerId) {
    const dx = x - state.lookLastX;
    const dy = y - state.lookLastY;
    state.lookLastX = x;
    state.lookLastY = y;
    return { action: 'look', dx, dy };
  }
  return { action: 'none' };
}

export function handleTouchEnd(state: TouchGestureState, pointerId: number): EndResult {
  if (pointerId === state.movePointerId) {
    state.movePointerId = null;
    return { action: 'endMove' };
  }
  if (pointerId === state.lookPointerId) {
    state.lookPointerId = null;
    return { action: 'endLook' };
  }
  return { action: 'none' };
}
