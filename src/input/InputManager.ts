export interface InputState {
  moveX: number;
  moveZ: number;
  lookDx: number;
  lookDy: number;
  fire: boolean;
  shop: boolean;
  pause: boolean;
}

export class InputManager {
  private keys = new Set<string>();
  private lookDx = 0;
  private lookDy = 0;
  private fireHeld = false;
  private shopPressed = false;
  private pausePressed = false;
  private touchMove = { x: 0, y: 0 };
  private pointerLocked = false;

  constructor(private canvas: HTMLElement) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
  }

  setTouchMove(x: number, y: number): void {
    this.touchMove.x = x;
    this.touchMove.y = y;
  }

  setTouchLook(dx: number, dy: number): void {
    this.lookDx += dx;
    this.lookDy += dy;
  }

  pressFire(down: boolean): void {
    this.fireHeld = down;
  }

  pressShop(): void {
    this.shopPressed = true;
  }

  pressPause(): void {
    this.pausePressed = true;
  }

  requestPointerLock(): void {
    this.canvas.requestPointerLock?.();
  }

  consume(uiOpen: boolean): InputState {
    const state: InputState = {
      moveX: 0,
      moveZ: 0,
      lookDx: uiOpen ? 0 : this.lookDx,
      lookDy: uiOpen ? 0 : this.lookDy,
      fire: !uiOpen && this.fireHeld,
      shop: this.shopPressed,
      pause: this.pausePressed,
    };

    if (!uiOpen) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) state.moveZ -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) state.moveZ += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) state.moveX -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) state.moveX += 1;
      state.moveX += this.touchMove.x;
      state.moveZ += this.touchMove.y;
      if (this.keys.has('KeyE')) state.shop = true;
      if (this.keys.has('Escape')) state.pause = true;
    }

    this.lookDx = 0;
    this.lookDy = 0;
    this.shopPressed = false;
    this.pausePressed = false;
    this.pointerLocked = document.pointerLockElement === this.canvas;
    return state;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
    if (e.code === 'Escape') this.pausePressed = true;
    if (e.code === 'KeyE') this.shopPressed = true;
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) {
      if (!this.pointerLocked) this.requestPointerLock();
      this.fireHeld = true;
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) this.fireHeld = false;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (document.pointerLockElement === this.canvas) {
      this.lookDx += e.movementX;
      this.lookDy += e.movementY;
    }
  };
}
