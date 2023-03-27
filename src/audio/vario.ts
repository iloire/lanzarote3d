import beep200 from "./beep/audiocheck.net_sin_200Hz_-3dBFS_0.3s.wav";
import beep400 from "./beep/audiocheck.net_sin_400Hz_-3dBFS_0.3s.wav";
import beep600 from "./beep/audiocheck.net_sin_600Hz_-3dBFS_0.3s.wav";
import beep800 from "./beep/audiocheck.net_sin_800Hz_-3dBFS_0.3s.wav";
import beep1000 from "./beep/audiocheck.net_sin_1000Hz_-3dBFS_0.3s.wav";
import beep1200 from "./beep/audiocheck.net_sin_1200Hz_-3dBFS_0.3s.wav";
import * as THREE from "three";
import Paraglider from "../elements/pg";

class Vario extends THREE.EventDispatcher {
  sound: any;
  pg: Paraglider;
  status: string = "off";
  paused: boolean;
  lastRecord: number;
  high: number;
  volume: number = 0.3;
  wrapSpeed: number = 1;

  constructor(pg: Paraglider) {
    super();
    const listener = new THREE.AudioListener();
    this.sound = new THREE.Audio(listener);
    this.sound.setVolume(this.volume);
    this.pg = pg;
    this.tick();
  }

  updateWrapSpeed(value: number) {
    this.wrapSpeed = value;
  }

  pause() {
    this.paused = true;
    this.sound.setVolume(0);
  }

  start() {
    this.status = "on";
    this.dispatchEvent({ type: "status", status: "on" });
  }

  stop() {
    this.status = "off";
    this.dispatchEvent({ type: "status", status: "off" });
  }

  toggle() {
    if (this.status === "off") {
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
    if (this.status === "on") {
      if (Math.abs(delta) > 0.5) {
        this.play(delta);
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

  getBeepForIncrement(delta) {
    if (delta > 2) {
      return beep1200;
    } else if (delta > 1.5) {
      return beep1000;
    } else if (delta > 1) {
      return beep800;
    } else if (delta > 0) {
      return beep600;
    } else if (delta > -0.5) {
      return beep400;
    } else {
      return beep200;
    }
  }

  play(delta) {
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(this.getBeepForIncrement(delta), (buffer) => {
      this.sound.setBuffer(buffer);
      this.sound.play();
    });
  }

  updateReading(altitude) {
    this.dispatchEvent({ type: "altitude", altitude });
    this.high = altitude;
  }
}

export default Vario;
