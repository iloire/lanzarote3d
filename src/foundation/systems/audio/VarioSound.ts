import * as THREE from 'three';
import Flier from '../../types/flier';

// Define event types for Vario
export interface VarioEventMap {
  status: { status: string };
  altitude: { altitude: any };
}

class Vario extends THREE.EventDispatcher<VarioEventMap> {
  sound: any;
  pg: Flier;
  status: string = 'off';
  paused: boolean = false;
  lastRecord: number = 0;
  high: number = 0;
  volume: number = 0.3;
  wrapSpeed: number = 1;
  beepFiles: Record<string, string> = {};
  loading: boolean = false;
  loaded: boolean = false;

  constructor(pg: Flier) {
    super();
    const listener = new THREE.AudioListener();
    this.sound = new THREE.Audio(listener);
    this.sound.setVolume(this.volume);
    this.pg = pg;
    this.tick();
  }

  async loadBeepFiles(): Promise<void> {
    if (this.loading || this.loaded) {
      return;
    }

    this.loading = true;

    try {
      const [beep200, beep400, beep600, beep800, beep1000, beep1200] = await Promise.all([
        import(
          '../../../../assets/foundation/audio/vario/audiocheck.net_sin_200Hz_-3dBFS_0.3s.wav'
        ),
        import(
          '../../../../assets/foundation/audio/vario/audiocheck.net_sin_400Hz_-3dBFS_0.3s.wav'
        ),
        import(
          '../../../../assets/foundation/audio/vario/audiocheck.net_sin_600Hz_-3dBFS_0.3s.wav'
        ),
        import(
          '../../../../assets/foundation/audio/vario/audiocheck.net_sin_800Hz_-3dBFS_0.3s.wav'
        ),
        import(
          '../../../../assets/foundation/audio/vario/audiocheck.net_sin_1000Hz_-3dBFS_0.3s.wav'
        ),
        import(
          '../../../../assets/foundation/audio/vario/audiocheck.net_sin_1200Hz_-3dBFS_0.3s.wav'
        ),
      ]);

      this.beepFiles = {
        beep200: beep200.default,
        beep400: beep400.default,
        beep600: beep600.default,
        beep800: beep800.default,
        beep1000: beep1000.default,
        beep1200: beep1200.default,
      };

      this.loaded = true;
    } catch (error) {
      console.error('Failed to load vario audio files:', error);
    } finally {
      this.loading = false;
    }
  }

  updateWrapSpeed(value: number) {
    this.wrapSpeed = value;
  }

  pause() {
    this.paused = true;
    this.sound.setVolume(0);
  }

  start() {
    this.status = 'on';
    this.dispatchEvent({ type: 'status', status: 'on' });
  }

  stop() {
    this.status = 'off';
    this.dispatchEvent({ type: 'status', status: 'off' });
  }

  toggle() {
    if (this.status === 'off') {
      this.start();
    } else {
      this.stop();
    }
  }

  tick = () => {
    if (!this.high) {
      setTimeout(this.tick, 1000);
      return;
    }
    const delta = (this.high - this.lastRecord || this.high) / this.wrapSpeed;
    this.lastRecord = this.high;
    if (this.status === 'on') {
      if (Math.abs(delta) > 0.5) {
        this.play(delta).catch(error => {
          console.error('Error playing vario sound:', error);
        });
      }
    }

    let delay = 2000;
    if (delta > 4) {
      delay = 600;
    } else if (delta > 3) {
      delay = 700;
    } else if (delta > 2) {
      delay = 800;
    } else if (delta > 1.5) {
      delay = 1000;
    } else if (delta > 1) {
      delay = 1500;
    } else {
      delay = 2000;
    }
    setTimeout(this.tick, delay);
  };

  getBeepForIncrement(delta: number): string | null {
    if (!this.loaded) {
      return null;
    }

    if (delta > 2) {
      return this.beepFiles['beep1200'] || null;
    } else if (delta > 1.5) {
      return this.beepFiles['beep1000'] || null;
    } else if (delta > 1) {
      return this.beepFiles['beep800'] || null;
    } else if (delta > 0) {
      return this.beepFiles['beep600'] || null;
    } else if (delta > -0.5) {
      return this.beepFiles['beep400'] || null;
    } else {
      return this.beepFiles['beep200'] || null;
    }
  }

  async play(delta: number) {
    await this.loadBeepFiles(); // Ensure files are loaded

    const beepUrl = this.getBeepForIncrement(delta);
    if (!beepUrl) {
      return;
    }

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(
      beepUrl,
      buffer => {
        this.sound.setBuffer(buffer);
        this.sound.play();
      },
      undefined, // onProgress
      error => {
        console.error('Error loading vario beep:', error);
      }
    );
  }

  updateReading(altitude: number) {
    this.dispatchEvent({ type: 'altitude', altitude });
    this.high = altitude;
  }
}

export default Vario;
