import * as THREE from 'three';
export interface ComponentConfig {
    position?: THREE.Vector3;
    rotation?: THREE.Euler;
    scale?: THREE.Vector3;
}
export interface VehicleConfig extends ComponentConfig {
    pilot?: string;
    model?: string;
    physics?: boolean;
}
export interface EnvironmentConfig extends ComponentConfig {
    lighting?: 'static' | 'dynamic';
    weather?: 'clear' | 'cloudy' | 'stormy';
    timeOfDay?: 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
}
export interface PhysicsConfig extends ComponentConfig {
    enabled?: boolean;
    gravity?: number;
    wind?: THREE.Vector3;
}
export interface UIConfig extends ComponentConfig {
    visible?: boolean;
    interactive?: boolean;
}
//# sourceMappingURL=components.d.ts.map