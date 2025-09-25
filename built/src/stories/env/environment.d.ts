import * as THREE from "three";
import Weather from "../../elements/weather";
import Thermal from "../../components/thermal";
import Birds from "../../components/birds";
import HangGlider from "../../components/hangglider";
import { CloudOptions } from "../../components/cloud";
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
    addClouds(weather: Weather, thermals: Thermal[], options: CloudOptions): Promise<THREE.Object3D[]>;
    getThermals(): Thermal[];
}
export default Environment;
//# sourceMappingURL=environment.d.ts.map