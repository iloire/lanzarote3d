declare module 'lil-gui' {
  export interface GUIController {
    destroy(): void;
    disable(disabled?: boolean): this;
    enable(enabled?: boolean): this;
    hide(): this;
    listen(onFinishChange?: boolean): this;
    max(max: number): this;
    min(min: number): this;
    name(name: string): this;
    onChange(callback: (value: any) => void): this;
    onFinishChange(callback: (value: any) => void): this;
    options(options: any[]): this;
    options(options: { [key: string]: any }): this;
    reset(): this;
    show(): this;
    step(step: number): this;
    updateDisplay(): this;
  }

  export interface GUIFolder {
    title: string;
    parent: GUI;
    children: Array<GUIController | GUIFolder>;
    folders: GUIFolder[];
    controllers: GUIController[];
    add(object: object, property: string): GUIController;
    add(object: object, property: string, min?: number, max?: number, step?: number): GUIController;
    addColor(object: object, property: string): GUIController;
    addFolder(name: string): GUIFolder;
    destroy(): void;
    hide(): void;
    listen(): void;
    open(open?: boolean): void;
    remove(controller: GUIController): void;
    removeFolder(folder: GUIFolder): void;
    show(): void;
  }

  export default class GUI {
    constructor(options?: { container?: HTMLElement; width?: number; title?: string });
    parent: GUI;
    children: Array<GUIController | GUIFolder>;
    folders: GUIFolder[];
    controllers: GUIController[];
    add(object: object, property: string): GUIController;
    add(object: object, property: string, min?: number, max?: number, step?: number): GUIController;
    addColor(object: object, property: string): GUIController;
    addFolder(name: string): GUIFolder;
    destroy(): void;
    hide(): void;
    listen(): void;
    open(open?: boolean): void;
    remove(controller: GUIController): void;
    removeFolder(folder: GUIFolder): void;
    show(): void;
  }
} 