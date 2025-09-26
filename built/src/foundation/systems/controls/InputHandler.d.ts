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
    keydown: {
        key: string;
        keyCode: number;
        action?: string;
    };
    keyup: {
        key: string;
        keyCode: number;
        action?: string;
    };
    mousemove: {
        deltaX: number;
        deltaY: number;
    };
    mousedown: {
        button: number;
        x: number;
        y: number;
    };
    mouseup: {
        button: number;
        x: number;
        y: number;
    };
    touchstart: {
        touches: Touch[];
    };
    touchmove: {
        touches: Touch[];
    };
    touchend: {
        touches: Touch[];
    };
}
export declare class InputHandler extends EventTarget {
    private config;
    private keyStates;
    private mouseState;
    private boundHandlers;
    constructor(config: InputConfig);
    private setupEventListeners;
    private handleKeyDown;
    private handleKeyUp;
    private handleMouseMove;
    private handleMouseDown;
    private handleMouseUp;
    private handleTouchStart;
    private handleTouchMove;
    private handleTouchEnd;
    isKeyPressed(key: string): boolean;
    updateKeyBindings(keyBindings: KeyBinding[]): void;
    setMouseSensitivity(sensitivity: number): void;
    setTouchSensitivity(sensitivity: number): void;
    dispose(): void;
}
export default InputHandler;
//# sourceMappingURL=InputHandler.d.ts.map