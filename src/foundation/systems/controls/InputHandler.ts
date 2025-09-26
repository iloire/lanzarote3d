export interface KeyBinding {
  key: string;
  keyCode?: number;
  action: string;
  description?: string;
}

export interface InputConfig {
  keyBindings: KeyBinding[];
  mouseSensitivity?: number;
  touchSensitivity?: number;
}

export interface InputEventMap {
  keydown: { key: string; keyCode: number; action?: string };
  keyup: { key: string; keyCode: number; action?: string };
  mousemove: { deltaX: number; deltaY: number };
  mousedown: { button: number; x: number; y: number };
  mouseup: { button: number; x: number; y: number };
  touchstart: { touches: Touch[] };
  touchmove: { touches: Touch[] };
  touchend: { touches: Touch[] };
}

export class InputHandler extends EventTarget {
  private config: InputConfig;
  private keyStates: Map<string, boolean> = new Map();
  private mouseState = { x: 0, y: 0, buttons: 0 };
  private boundHandlers: Map<string, EventListener> = new Map();

  constructor(config: InputConfig) {
    super();
    this.config = {
      mouseSensitivity: 1.0,
      touchSensitivity: 1.0,
      ...config,
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    const keydownHandler = (event: KeyboardEvent) => this.handleKeyDown(event);
    const keyupHandler = (event: KeyboardEvent) => this.handleKeyUp(event);

    document.addEventListener('keydown', keydownHandler);
    document.addEventListener('keyup', keyupHandler);

    this.boundHandlers.set('keydown', keydownHandler);
    this.boundHandlers.set('keyup', keyupHandler);

    // Mouse events
    const mousemoveHandler = (event: MouseEvent) => this.handleMouseMove(event);
    const mousedownHandler = (event: MouseEvent) => this.handleMouseDown(event);
    const mouseupHandler = (event: MouseEvent) => this.handleMouseUp(event);

    document.addEventListener('mousemove', mousemoveHandler);
    document.addEventListener('mousedown', mousedownHandler);
    document.addEventListener('mouseup', mouseupHandler);

    this.boundHandlers.set('mousemove', mousemoveHandler);
    this.boundHandlers.set('mousedown', mousedownHandler);
    this.boundHandlers.set('mouseup', mouseupHandler);

    // Touch events
    const touchstartHandler = (event: TouchEvent) => this.handleTouchStart(event);
    const touchmoveHandler = (event: TouchEvent) => this.handleTouchMove(event);
    const touchendHandler = (event: TouchEvent) => this.handleTouchEnd(event);

    document.addEventListener('touchstart', touchstartHandler);
    document.addEventListener('touchmove', touchmoveHandler);
    document.addEventListener('touchend', touchendHandler);

    this.boundHandlers.set('touchstart', touchstartHandler);
    this.boundHandlers.set('touchmove', touchmoveHandler);
    this.boundHandlers.set('touchend', touchendHandler);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const keyCode = event.keyCode || event.which;

    this.keyStates.set(key, true);

    // Find action for this key
    const binding = this.config.keyBindings.find(
      b => b.key.toLowerCase() === key || b.keyCode === keyCode
    );

    this.dispatchEvent(
      new CustomEvent('keydown', {
        detail: { key, keyCode, action: binding?.action },
      })
    );
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const keyCode = event.keyCode || event.which;

    this.keyStates.set(key, false);

    // Find action for this key
    const binding = this.config.keyBindings.find(
      b => b.key.toLowerCase() === key || b.keyCode === keyCode
    );

    this.dispatchEvent(
      new CustomEvent('keyup', {
        detail: { key, keyCode, action: binding?.action },
      })
    );
  }

  private handleMouseMove(event: MouseEvent): void {
    const deltaX = (event.clientX - this.mouseState.x) * this.config.mouseSensitivity!;
    const deltaY = (event.clientY - this.mouseState.y) * this.config.mouseSensitivity!;

    this.mouseState.x = event.clientX;
    this.mouseState.y = event.clientY;

    this.dispatchEvent(
      new CustomEvent('mousemove', {
        detail: { deltaX, deltaY },
      })
    );
  }

  private handleMouseDown(event: MouseEvent): void {
    this.mouseState.buttons |= 1 << event.button;

    this.dispatchEvent(
      new CustomEvent('mousedown', {
        detail: { button: event.button, x: event.clientX, y: event.clientY },
      })
    );
  }

  private handleMouseUp(event: MouseEvent): void {
    this.mouseState.buttons &= ~(1 << event.button);

    this.dispatchEvent(
      new CustomEvent('mouseup', {
        detail: { button: event.button, x: event.clientX, y: event.clientY },
      })
    );
  }

  private handleTouchStart(event: TouchEvent): void {
    this.dispatchEvent(
      new CustomEvent('touchstart', {
        detail: { touches: Array.from(event.touches) },
      })
    );
  }

  private handleTouchMove(event: TouchEvent): void {
    this.dispatchEvent(
      new CustomEvent('touchmove', {
        detail: { touches: Array.from(event.touches) },
      })
    );
  }

  private handleTouchEnd(event: TouchEvent): void {
    this.dispatchEvent(
      new CustomEvent('touchend', {
        detail: { touches: Array.from(event.changedTouches) },
      })
    );
  }

  // Public API methods
  isKeyPressed(key: string): boolean {
    return this.keyStates.get(key.toLowerCase()) || false;
  }

  updateKeyBindings(keyBindings: KeyBinding[]): void {
    this.config.keyBindings = keyBindings;
  }

  setMouseSensitivity(sensitivity: number): void {
    this.config.mouseSensitivity = sensitivity;
  }

  setTouchSensitivity(sensitivity: number): void {
    this.config.touchSensitivity = sensitivity;
  }

  dispose(): void {
    // Remove all event listeners
    this.boundHandlers.forEach((handler, event) => {
      document.removeEventListener(event, handler);
    });
    this.boundHandlers.clear();
    this.keyStates.clear();
  }
}

export default InputHandler;
