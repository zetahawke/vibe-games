import { describe, expect, it } from 'vitest';
import {
  STICK_RADIUS,
  clearTouchGesture,
  createTouchGestureState,
  handleTouchDown,
  handleTouchEnd,
  handleTouchMove,
} from '@/game/input/touchGesture';

describe('touchGesture', () => {
  it('first pointer starts move and clears implied fresh origin', () => {
    const s = createTouchGestureState();
    const r = handleTouchDown(s, 1, 100, 200);
    expect(r).toEqual({ action: 'startMove', originX: 100, originY: 200 });
    expect(s.movePointerId).toBe(1);
    expect(s.lookPointerId).toBeNull();
  });

  it('second pointer starts look while move is active', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 10, 10);
    const r = handleTouchDown(s, 2, 50, 60);
    expect(r).toEqual({ action: 'startLook', x: 50, y: 60 });
    expect(s.lookPointerId).toBe(2);
  });

  it('third pointer is ignored', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    handleTouchDown(s, 2, 1, 1);
    expect(handleTouchDown(s, 3, 2, 2)).toEqual({ action: 'ignore' });
  });

  it('move drag returns normalized vector clamped to radius', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    const inside = handleTouchMove(s, 1, STICK_RADIUS / 2, 0);
    expect(inside).toEqual({
      action: 'move',
      nx: 0.5,
      ny: 0,
      knobDx: STICK_RADIUS / 2,
      knobDy: 0,
    });
    const far = handleTouchMove(s, 1, 500, 0);
    expect(far).toEqual({
      action: 'move',
      nx: 1,
      ny: 0,
      knobDx: STICK_RADIUS,
      knobDy: 0,
    });
  });

  it('look drag returns delta from last point and updates last', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    handleTouchDown(s, 2, 10, 20);
    expect(handleTouchMove(s, 2, 15, 28)).toEqual({ action: 'look', dx: 5, dy: 8 });
    expect(handleTouchMove(s, 2, 15, 28)).toEqual({ action: 'look', dx: 0, dy: 0 });
  });

  it('ending move does not promote look to move', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    handleTouchDown(s, 2, 10, 10);
    expect(handleTouchEnd(s, 1)).toEqual({ action: 'endMove' });
    expect(s.movePointerId).toBeNull();
    expect(s.lookPointerId).toBe(2);
  });

  it('ending look leaves move active', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    handleTouchDown(s, 2, 10, 10);
    expect(handleTouchEnd(s, 2)).toEqual({ action: 'endLook' });
    expect(s.movePointerId).toBe(1);
  });

  it('unknown pointer end is none', () => {
    const s = createTouchGestureState();
    expect(handleTouchEnd(s, 99)).toEqual({ action: 'none' });
  });

  it('clearTouchGesture clears both roles', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    handleTouchDown(s, 2, 1, 1);
    clearTouchGesture(s);
    expect(s.movePointerId).toBeNull();
    expect(s.lookPointerId).toBeNull();
  });

  it('new move after end can start again (no stuck role)', () => {
    const s = createTouchGestureState();
    handleTouchDown(s, 1, 0, 0);
    handleTouchMove(s, 1, 52, 0);
    handleTouchEnd(s, 1);
    const r = handleTouchDown(s, 5, 30, 40);
    expect(r).toEqual({ action: 'startMove', originX: 30, originY: 40 });
  });
});
