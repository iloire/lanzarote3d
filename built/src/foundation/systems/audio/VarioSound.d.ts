import * as THREE from 'three';
import Flier from '../../types/flier';
export interface VarioEventMap {
    status: {
        status: string;
    };
    altitude: {
        altitude: any;
    };
}
declare class Vario extends THREE.EventDispatcher<VarioEventMap> {
    sound: any;
    pg: Flier;
    status: string;
    paused: boolean;
    lastRecord: number;
    high: number;
    volume: number;
    wrapSpeed: number;
    beepFiles: Record<string, string>;
    loading: boolean;
    loaded: boolean;
    constructor(pg: Flier);
    loadBeepFiles(): Promise<void>;
    updateWrapSpeed(value: number): void;
    pause(): void;
    start(): void;
    stop(): void;
    toggle(): void;
    tick: () => void;
    getBeepForIncrement(delta: number): string | null;
    play(delta: number): Promise<void>;
    updateReading(altitude: number): void;
}
export default Vario;
//# sourceMappingURL=VarioSound.d.ts.map