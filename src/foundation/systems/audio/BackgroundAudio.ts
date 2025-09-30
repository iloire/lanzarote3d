import * as THREE from 'three';
import { logger } from '../../utils/logger';

class BackgroundSound {
  wind1: THREE.Audio | null = null;
  wind2: THREE.Audio | null = null;
  music: THREE.Audio | null = null;
  enabled: boolean = false;
  paused: boolean = false;
  volume: number = 0.3;
  loading: boolean = false;
  loaded: boolean = false;

  constructor() {
    // Don't load immediately - wait for explicit load() call
  }

  isPlaying() {
    return [this.wind1, this.wind2, this.music].filter(i => i !== null).every(i => i!.isPlaying);
  }

  async loadSound(audioUrl: string, volume?: number): Promise<THREE.Audio> {
    const listener = new THREE.AudioListener();
    const sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();

    if (volume) {
      this.volume = volume;
    }

    return new Promise((resolve, reject) => {
      audioLoader.load(
        audioUrl,
        buffer => {
          sound.setBuffer(buffer);
          sound.setLoop(true);
          sound.setVolume(this.volume);
          resolve(sound);
        },
        undefined, // onProgress
        error => {
          logger.error('Error loading audio:', error);
          reject(error);
        }
      );
    });
  }

  async load(): Promise<void> {
    if (this.loading || this.loaded) {
      return;
    }

    this.loading = true;

    try {
      // Dynamic imports for audio files
      const [wind1Module, wind2Module, musicModule] = await Promise.all([
        import('../../../../assets/foundation/audio/environment/wind-howl-01.mp3'),
        import('../../../../assets/foundation/audio/environment/hurricane-01.mp3'),
        import('../../../../assets/foundation/audio/environment/the-beat-of-nature-122841.mp3'),
      ]);

      // Load audio objects
      const [wind1, wind2, music] = await Promise.all([
        this.loadSound(wind1Module.default, 0.2),
        this.loadSound(wind2Module.default, 0.2),
        this.loadSound(musicModule.default, 0.3),
      ]);

      this.wind1 = wind1;
      this.wind2 = wind2;
      this.music = music;
      this.loaded = true;
    } catch (error) {
      logger.error('Failed to load background audio:', error);
    } finally {
      this.loading = false;
    }
  }

  async toggle() {
    await this.load(); // Ensure audio is loaded

    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  pause() {
    this.paused = true;
    if (this.wind1) this.wind1.pause();
    if (this.wind2) this.wind2.pause();
    if (this.music) this.music.pause();
  }

  async play() {
    await this.load(); // Ensure audio is loaded

    if (this.wind1) this.wind1.play();
    if (this.wind2) this.wind2.play();
    if (this.music) this.music.play();
    this.enabled = true;
  }

  stop() {
    if (this.enabled) {
      if (this.wind1) this.wind1.stop();
      if (this.wind2) this.wind2.stop();
      if (this.music) this.music.stop();
      this.enabled = false;
    }
  }
}

export default BackgroundSound;
