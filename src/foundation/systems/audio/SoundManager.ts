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

export class SoundManager {
  private listener: THREE.AudioListener;
  private sounds: Map<string, SoundInstance> = new Map();
  private audioLoader: THREE.AudioLoader = new THREE.AudioLoader();
  private masterVolume: number = 1.0;
  private muted: boolean = false;

  constructor(camera?: THREE.Camera) {
    this.listener = new THREE.AudioListener();
    if (camera) {
      camera.add(this.listener);
    }
  }

  // Load and register a sound
  async loadSound(id: string, source: string, config: SoundConfig = {}): Promise<void> {
    const finalConfig: SoundConfig = {
      volume: 1.0,
      loop: false,
      autoplay: false,
      positional: false,
      maxDistance: 1000,
      rolloffFactor: 1,
      ...config,
    };

    // Create appropriate audio object
    const audio = finalConfig.positional
      ? new THREE.PositionalAudio(this.listener)
      : new THREE.Audio(this.listener);

    if (finalConfig.positional && audio instanceof THREE.PositionalAudio) {
      audio.setMaxDistance(finalConfig.maxDistance!);
      audio.setRolloffFactor(finalConfig.rolloffFactor!);
    }

    const soundInstance: SoundInstance = {
      id,
      audio,
      source,
      config: finalConfig,
      isLoaded: false,
      isPlaying: false,
    };

    this.sounds.set(id, soundInstance);

    // Load the audio buffer
    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        source,
        buffer => {
          audio.setBuffer(buffer);
          audio.setLoop(finalConfig.loop!);
          audio.setVolume(finalConfig.volume! * this.masterVolume);
          soundInstance.isLoaded = true;

          if (finalConfig.autoplay) {
            this.play(id);
          }
          resolve();
        },
        undefined,
        error => {
          console.error(`Failed to load sound ${id}:`, error);
          reject(error);
        }
      );
    });
  }

  // Play a sound
  play(id: string): boolean {
    const sound = this.sounds.get(id);
    if (!sound || !sound.isLoaded || this.muted) {
      return false;
    }

    if (!sound.audio.isPlaying) {
      sound.audio.play();
      sound.isPlaying = true;
    }
    return true;
  }

  // Stop a sound
  stop(id: string): boolean {
    const sound = this.sounds.get(id);
    if (!sound || !sound.isLoaded) {
      return false;
    }

    if (sound.audio.isPlaying) {
      sound.audio.stop();
      sound.isPlaying = false;
    }
    return true;
  }

  // Pause a sound
  pause(id: string): boolean {
    const sound = this.sounds.get(id);
    if (!sound || !sound.isLoaded) {
      return false;
    }

    if (sound.audio.isPlaying) {
      sound.audio.pause();
      sound.isPlaying = false;
    }
    return true;
  }

  // Resume a sound
  resume(id: string): boolean {
    const sound = this.sounds.get(id);
    if (!sound || !sound.isLoaded) {
      return false;
    }

    sound.audio.play();
    sound.isPlaying = true;
    return true;
  }

  // Toggle play/pause
  toggle(id: string): boolean {
    const sound = this.sounds.get(id);
    if (!sound || !sound.isLoaded) {
      return false;
    }

    if (sound.isPlaying) {
      return this.pause(id);
    } else {
      return this.play(id);
    }
  }

  // Set volume for a specific sound
  setVolume(id: string, volume: number): boolean {
    const sound = this.sounds.get(id);
    if (!sound || !sound.isLoaded) {
      return false;
    }

    sound.config.volume = Math.max(0, Math.min(1, volume));
    sound.audio.setVolume(sound.config.volume * this.masterVolume);
    return true;
  }

  // Set master volume
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));

    // Update all sound volumes
    this.sounds.forEach(sound => {
      if (sound.isLoaded) {
        sound.audio.setVolume(sound.config.volume! * this.masterVolume);
      }
    });
  }

  // Mute/unmute all sounds
  setMuted(muted: boolean): void {
    this.muted = muted;

    if (muted) {
      this.sounds.forEach(sound => {
        if (sound.isLoaded && sound.isPlaying) {
          sound.audio.setVolume(0);
        }
      });
    } else {
      this.sounds.forEach(sound => {
        if (sound.isLoaded) {
          sound.audio.setVolume(sound.config.volume! * this.masterVolume);
        }
      });
    }
  }

  // Set position for positional audio
  setPosition(id: string, position: THREE.Vector3): boolean {
    const sound = this.sounds.get(id);
    if (!sound || !sound.isLoaded || !sound.config.positional) {
      return false;
    }

    if (sound.audio instanceof THREE.PositionalAudio) {
      sound.audio.position.copy(position);
    }
    return true;
  }

  // Get sound info
  getSoundInfo(id: string): SoundInstance | undefined {
    return this.sounds.get(id);
  }

  // Check if sound is playing
  isPlaying(id: string): boolean {
    const sound = this.sounds.get(id);
    return sound ? sound.isPlaying && sound.audio.isPlaying : false;
  }

  // Get all sound IDs
  getSoundIds(): string[] {
    return Array.from(this.sounds.keys());
  }

  // Remove a sound
  removeSound(id: string): boolean {
    const sound = this.sounds.get(id);
    if (!sound) {
      return false;
    }

    if (sound.isPlaying) {
      sound.audio.stop();
    }

    this.sounds.delete(id);
    return true;
  }

  // Clean up resources
  dispose(): void {
    this.sounds.forEach(sound => {
      if (sound.isPlaying) {
        sound.audio.stop();
      }
    });
    this.sounds.clear();
  }

  // Get the audio listener (for camera attachment)
  getListener(): THREE.AudioListener {
    return this.listener;
  }
}

export default SoundManager;
