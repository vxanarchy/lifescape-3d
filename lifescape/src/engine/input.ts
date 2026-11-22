export interface InputState {
  forward: number;
  backward: number;
  left: number;
  right: number;
  jump: boolean;
  interact: boolean;
  enterVehicle: boolean;
  run: boolean;
  pause: boolean;
  smartphone: boolean;
  mouse: {
    deltaX: number;
    deltaY: number;
  };
}

export class InputManager {
  private keys: Set<string> = new Set();
  private previousKeys: Set<string> = new Set();
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private mouseSensitivity: number = 0.002;
  private isLocked: boolean = false;

  constructor() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    this.keys.add(e.key.toLowerCase());
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key.toLowerCase());
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isLocked) return;
    this.mouseDeltaX = e.movementX || 0;
    this.mouseDeltaY = e.movementY || 0;
  }

  public getState(): InputState {
    return {
      forward: this.keys.has('w') ? 1 : 0,
      backward: this.keys.has('s') ? 1 : 0,
      left: this.keys.has('a') ? 1 : 0,
      right: this.keys.has('d') ? 1 : 0,
      jump: this.keys.has(' '),
      interact: this.keys.has('e'),
      enterVehicle: this.keys.has('f'),
      run: this.keys.has('Shift'),
      pause: this.keys.has('Escape'),
      smartphone: this.keys.has('p'),
      mouse: {
        deltaX: this.mouseDeltaX,
        deltaY: this.mouseDeltaY,
      },
    };
  }

  public wasPressed(key: string): boolean {
    const keyLower = key.toLowerCase();
    return this.keys.has(keyLower) && !this.previousKeys.has(keyLower);
  }

  public update(): void {
    this.previousKeys = new Set(this.keys);
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }

  public lockPointer(): void {
    this.isLocked = true;
    document.body.style.cursor = 'none';
  }

  public unlockPointer(): void {
    this.isLocked = false;
    document.body.style.cursor = 'default';
  }

  public getMouseSensitivity(): number {
    return this.mouseSensitivity;
  }

  public setMouseSensitivity(value: number): void {
    this.mouseSensitivity = value;
  }
}