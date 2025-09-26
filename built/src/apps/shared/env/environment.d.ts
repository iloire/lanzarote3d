import * as THREE from 'three';
import { Weather } from '../../../foundation/components/physics';
import { Thermal } from '../../../foundation/components/physics';
import Birds from '../../../foundation/components/wildlife/Birds';
import { Hangglider as HangGlider } from '../../../foundation/components/vehicles';
import { CloudOptions } from '../../../foundation/components/environment';
import { Theme } from '../../../foundation/types/Theme';
declare class Environment {
    birds: Birds;
    hg: HangGlider;
    thermals: Thermal[];
    scene: THREE.Scene;
    constructor(scene: THREE.Scene);
    updateWrapSpeed(wrapSpeed: number): void;
    addBirds(path: THREE.Vector3[], gui?: any): Promise<void>;
    addHangGlider(path: THREE.Vector3[], gui?: any): Promise<void>;
    addBoats(water: THREE.Mesh): void;
    addHouses(terrain: THREE.Mesh): void;
    addStones(terrain: THREE.Mesh): void;
    addPines(terrain: THREE.Mesh): void;
    addTrees(terrain: THREE.Mesh, scale?: number): void;
    addThermals(weather: Weather, opacity?: number): Thermal[];
    generateThermals(weather: Weather, opacity?: number): Thermal[];
    addClouds(thermals: Thermal[], options: CloudOptions): Promise<THREE.Object3D[]>;
    getThermals(): Thermal[];
    /**
     * Add clouds using theme settings
     */
    addCloudsFromTheme(thermals: Thermal[], theme: Theme): Promise<THREE.Object3D[]>;
    /**
     * Create weather from theme
     */
    createWeatherFromTheme(theme: Theme): Weather;
    /**
     * Apply theme to environment components
     */
    applyTheme(theme: Theme, options?: {
        terrain?: THREE.Mesh;
    }): Promise<void>;
    /**
     * Get terrain style from theme for use in terrain workshop demos
     */
    getTerrainStyleFromTheme(theme: Theme): string;
}
export default Environment;
//# sourceMappingURL=environment.d.ts.map