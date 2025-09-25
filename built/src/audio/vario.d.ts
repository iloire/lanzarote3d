import * as THREE from "three";
import Paraglider from "../components/base/flier";
declare class Vario extends THREE.EventDispatcher {
    sound: any;
    pg: Paraglider;
    status: string;
    paused: boolean;
    lastRecord: number;
    high: number;
    volume: number;
    wrapSpeed: number;
    constructor(pg: Paraglider);
    updateWrapSpeed(value: number): void;
    pause(): void;
    start(): void;
    stop(): void;
    toggle(): void;
    tick: () => void;
    getBeepForIncrement(delta: any): any;
    play(delta: any): void;
    updateReading(altitude: any): void;
}
export default Vario;
//# sourceMappingURL=vario.d.ts.map