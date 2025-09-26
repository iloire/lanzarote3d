import * as THREE from 'three';
export interface SceneConfig {
    environment?: string;
    lighting?: 'static' | 'dynamic';
    physics?: boolean;
    background?: THREE.Color | string;
}
export interface ControlsConfig {
    enabled?: boolean;
    keyboard?: boolean;
    mouse?: boolean;
    gamepad?: boolean;
}
export interface AudioConfig {
    enabled?: boolean;
    volume?: number;
    spatial?: boolean;
    context?: AudioContext;
}
export interface AnalyticsConfig {
    enabled?: boolean;
    performance?: boolean;
    userTracking?: boolean;
}
//# sourceMappingURL=systems.d.ts.map