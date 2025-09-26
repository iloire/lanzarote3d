import { KeyBinding } from './InputHandler';
import Flier from '../../types/flier';
export interface FlightControlsConfig {
    rotationSensitivity?: number;
    keyBindings?: KeyBinding[];
}
export declare const DEFAULT_FLIGHT_KEYBINDINGS: KeyBinding[];
export declare class FlightControls {
    private inputHandler;
    private flier?;
    private config;
    private leftPressed;
    private rightPressed;
    constructor(config?: FlightControlsConfig);
    private setupControls;
    private handleKeyDown;
    private handleKeyUp;
    private handleMouseMove;
    setFlier(flier: Flier): void;
    getFlier(): Flier | undefined;
    updateRotationSensitivity(sensitivity: number): void;
    updateKeyBindings(keyBindings: KeyBinding[]): void;
    isLeftPressed(): boolean;
    isRightPressed(): boolean;
    isKeyPressed(key: string): boolean;
    dispose(): void;
}
export default FlightControls;
//# sourceMappingURL=FlightControls.d.ts.map