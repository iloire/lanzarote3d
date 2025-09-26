import * as THREE from 'three';
import Weather from '../components/physics/Weather';
import Thermal from '../components/physics/Thermal';
import { TrajectoryPoint } from '../components/ui/Trajectory';
import IFlyable from './IFlyable';
export interface FlierConstructor {
    glidingRatio: number;
    trimSpeed: number;
    fullSpeedBarSpeed: number;
    bigEarsSpeed: number;
    flyable: IFlyable;
}
export interface EnvOptions {
    weather: Weather;
    terrain: THREE.Mesh;
    water: THREE.Mesh;
    thermals: Thermal[];
    perfStats?: any;
}
export interface FlierEventMap {
    touchedGround: {
        groundTouches: number;
    };
    crashed: {};
    drop: {
        drop: number;
    };
    dynamicLift: {
        lift: number;
    };
    thermalLift: {
        lift: number;
    };
    position: {
        position: THREE.Vector3;
    };
    delta: {
        delta: number;
    };
    heightAboveGround: {
        height: number;
    };
    gradient: {
        gradient: number;
    };
    lift: {
        lift: number;
    };
}
declare class Flier extends THREE.EventDispatcher<FlierEventMap> {
    options: FlierConstructor;
    weather: Weather;
    terrain: THREE.Mesh;
    water: THREE.Mesh;
    thermals: Thermal[];
    speedBar: boolean;
    ears: boolean;
    interval: number | null;
    mesh: THREE.Object3D;
    flyable: IFlyable;
    wrapSpeed: number;
    flyingTime: number;
    metersFlown: number;
    isLeftInput: boolean;
    isRightInput: boolean;
    trajectory: TrajectoryPoint[];
    tickCounter: number;
    __rollAngleRadians: number;
    __lift: number;
    __gradient: number;
    __directionInput: number;
    lift: number;
    rotationInertia: number;
    debug: boolean;
    numberGroundTouches: number;
    perfStats: any;
    id: string;
    constructor(options: FlierConstructor, envOptions: EnvOptions, debug?: boolean);
    isInsideThermal: (thermal: Thermal) => boolean;
    countInsideHowManyThermals(): number;
    isInsideAnyThermal(): boolean;
    updateWrapSpeed(value: number): void;
    init(): void;
    stop(): void;
    isRunning(): boolean;
    getMesh(): THREE.Object3D;
    tick(multiplier: number): void;
    rotate(yRotationIncrement: number, zAngle: number): void;
    getMetersFlown(): number;
    getGroundSpeed(): number;
    private move;
    addGui(gui: any): void;
    directionInput(direction: number): void;
    leftInput(): void;
    leftRelease(): void;
    rightInput(): void;
    rightRelease(): void;
    hasTouchedGround(terrain: THREE.Mesh, water: THREE.Mesh): boolean;
    getTerrainGradientAgainstWindDirection(terrain: THREE.Mesh, water: THREE.Mesh, windDirection: THREE.Vector3): number;
    getLiftValue(): number;
    direction(localVector?: THREE.Vector3): THREE.Vector3;
    rotation(): THREE.Quaternion;
    position(): THREE.Vector3;
    setPosition(pos: THREE.Vector3): void;
    altitude(): number;
    toggleEars(): void;
    toggleSpeedBar(): void;
    isOnSpeedBar(): boolean;
    isOnEars(): boolean;
    airSpeed(): number;
    trimSpeed(): number;
    glidingRatio(): number;
    getFlyingTime(): number;
    getTrajectory(): TrajectoryPoint[];
}
export default Flier;
//# sourceMappingURL=flier.d.ts.map