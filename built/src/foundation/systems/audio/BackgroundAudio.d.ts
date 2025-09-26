import * as THREE from 'three';
declare class BackgroundSound {
    wind1: THREE.Audio | null;
    wind2: THREE.Audio | null;
    music: THREE.Audio | null;
    enabled: boolean;
    paused: boolean;
    volume: number;
    loading: boolean;
    loaded: boolean;
    constructor();
    isPlaying(): boolean;
    loadSound(audioUrl: string, volume?: number): Promise<THREE.Audio>;
    load(): Promise<void>;
    toggle(): Promise<void>;
    pause(): void;
    play(): Promise<void>;
    stop(): void;
}
export default BackgroundSound;
//# sourceMappingURL=BackgroundAudio.d.ts.map