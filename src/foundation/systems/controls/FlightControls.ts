import { InputHandler, KeyBinding } from './InputHandler';
import Flier from '../../types/flier';

export interface FlightControlsConfig {
  rotationSensitivity?: number;
  keyBindings?: KeyBinding[];
}

export const DEFAULT_FLIGHT_KEYBINDINGS: KeyBinding[] = [
  { key: 'a', keyCode: 65, action: 'left', description: 'Turn left' },
  { key: 'd', keyCode: 68, action: 'right', description: 'Turn right' },
  { key: 'arrowleft', keyCode: 37, action: 'view-left', description: 'Look left' },
  { key: 'arrowright', keyCode: 39, action: 'view-right', description: 'Look right' },
  { key: 'arrowup', keyCode: 38, action: 'view-up', description: 'Look up' },
  { key: 'arrowdown', keyCode: 40, action: 'view-down', description: 'Look down' },
  { key: 'pageup', keyCode: 33, action: 'zoom-in', description: 'Zoom in' },
  { key: 'pagedown', keyCode: 34, action: 'zoom-out', description: 'Zoom out' },
  { key: 's', keyCode: 83, action: 'speed-bar', description: 'Toggle speed bar' },
  { key: 'e', keyCode: 69, action: 'big-ears', description: 'Toggle big ears' },
  { key: 'm', keyCode: 77, action: 'audio-toggle', description: 'Toggle audio' }
];

export class FlightControls {
  private inputHandler: InputHandler;
  private flier?: Flier;
  private config: FlightControlsConfig;

  private leftPressed: boolean = false;
  private rightPressed: boolean = false;

  constructor(config: FlightControlsConfig = {}) {
    this.config = {
      rotationSensitivity: 0.002,
      keyBindings: DEFAULT_FLIGHT_KEYBINDINGS,
      ...config
    };

    this.inputHandler = new InputHandler({
      keyBindings: this.config.keyBindings!,
      mouseSensitivity: this.config.rotationSensitivity
    });

    this.setupControls();
  }

  private setupControls(): void {
    // Key press handlers
    this.inputHandler.addEventListener('keydown', (event: CustomEvent) => {
      this.handleKeyDown(event.detail);
    });

    this.inputHandler.addEventListener('keyup', (event: CustomEvent) => {
      this.handleKeyUp(event.detail);
    });

    // Mouse controls for turn input
    this.inputHandler.addEventListener('mousemove', (event: CustomEvent) => {
      this.handleMouseMove(event.detail);
    });
  }

  private handleKeyDown(detail: { key: string; keyCode: number; action?: string }): void {
    if (!this.flier || !detail.action) return;

    switch (detail.action) {
      case 'left':
        this.leftPressed = true;
        this.flier.leftInput();
        break;
      case 'right':
        this.rightPressed = true;
        this.flier.rightInput();
        break;
      case 'speed-bar':
        this.flier.toggleSpeedBar();
        break;
      case 'big-ears':
        this.flier.toggleEars();
        break;
    }
  }

  private handleKeyUp(detail: { key: string; keyCode: number; action?: string }): void {
    if (!this.flier || !detail.action) return;

    switch (detail.action) {
      case 'left':
        this.leftPressed = false;
        this.flier.leftRelease();
        break;
      case 'right':
        this.rightPressed = false;
        this.flier.rightRelease();
        break;
    }
  }

  private handleMouseMove(detail: { deltaX: number; deltaY: number }): void {
    if (!this.flier) return;

    // Convert mouse movement to direction input
    const direction = detail.deltaX * this.config.rotationSensitivity!;
    this.flier.directionInput(direction);
  }

  // Public API methods
  setFlier(flier: Flier): void {
    this.flier = flier;
  }

  getFlier(): Flier | undefined {
    return this.flier;
  }

  updateRotationSensitivity(sensitivity: number): void {
    this.config.rotationSensitivity = sensitivity;
    this.inputHandler.setMouseSensitivity(sensitivity);
  }

  updateKeyBindings(keyBindings: KeyBinding[]): void {
    this.config.keyBindings = keyBindings;
    this.inputHandler.updateKeyBindings(keyBindings);
  }

  isLeftPressed(): boolean {
    return this.leftPressed;
  }

  isRightPressed(): boolean {
    return this.rightPressed;
  }

  isKeyPressed(key: string): boolean {
    return this.inputHandler.isKeyPressed(key);
  }

  dispose(): void {
    this.inputHandler.dispose();
    this.flier = undefined;
  }
}

export default FlightControls;