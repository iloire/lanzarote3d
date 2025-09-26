import * as THREE from 'three';
import { Sky } from '../../components/environment';
import { Weather } from '../../components/physics';
export interface SceneConfig {
    environment?: 'lanzarote' | 'custom';
    lighting?: 'dynamic' | 'static';
    physics?: boolean;
}
export interface SceneComponents {
    scene: THREE.Scene;
    sky?: Sky;
    weather?: Weather;
    lighting: {
        ambientLight: THREE.AmbientLight;
        directionalLight: THREE.DirectionalLight;
    };
}
export declare class SceneManager {
    private scene;
    private config;
    private components;
    constructor(config?: SceneConfig);
    private setupScene;
    private setupLanzaroteEnvironment;
    private setupPhysics;
    getScene(): THREE.Scene;
    getComponents(): SceneComponents;
    add(...objects: THREE.Object3D[]): void;
    remove(...objects: THREE.Object3D[]): void;
    updateLighting(timeOfDay: number): void;
    dispose(): void;
}
export default SceneManager;
//# sourceMappingURL=SceneManager.d.ts.map