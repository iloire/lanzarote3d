import * as THREE from "three";
declare class BackgroundSound {
    wind1: THREE.Audio;
    wind2: THREE.Audio;
    music: THREE.Audio;
    enabled: boolean;
    paused: boolean;
    volume: number;
    constructor();
    isPlaying(): boolean;
    loadSound(file: any, volume?: number): THREE.Audio<GainNode>;
    load(): void;
    toggle(): void;
    pause(): void;
    play(): void;
    stop(): void;
}
export default BackgroundSound;
//# sourceMappingURL=background.d.ts.map