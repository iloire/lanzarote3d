import * as THREE from 'three';
export interface SoundConfig {
    volume?: number;
    loop?: boolean;
    autoplay?: boolean;
    positional?: boolean;
    maxDistance?: number;
    rolloffFactor?: number;
}
export interface SoundInstance {
    id: string;
    audio: THREE.Audio | THREE.PositionalAudio;
    source: string;
    config: SoundConfig;
    isLoaded: boolean;
    isPlaying: boolean;
}
export declare class SoundManager {
    private listener;
    private sounds;
    private audioLoader;
    private masterVolume;
    private muted;
    constructor(camera?: THREE.Camera);
    loadSound(id: string, source: string, config?: SoundConfig): Promise<void>;
    play(id: string): boolean;
    stop(id: string): boolean;
    pause(id: string): boolean;
    resume(id: string): boolean;
    toggle(id: string): boolean;
    setVolume(id: string, volume: number): boolean;
    setMasterVolume(volume: number): void;
    setMuted(muted: boolean): void;
    setPosition(id: string, position: THREE.Vector3): boolean;
    getSoundInfo(id: string): SoundInstance | undefined;
    isPlaying(id: string): boolean;
    getSoundIds(): string[];
    removeSound(id: string): boolean;
    dispose(): void;
    getListener(): THREE.AudioListener;
}
export default SoundManager;
//# sourceMappingURL=SoundManager.d.ts.map