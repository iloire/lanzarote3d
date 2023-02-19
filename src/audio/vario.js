import beep200 from "./beep/audiocheck.net_sin_200Hz_-3dBFS_0.3s.wav";
import beep800 from "./beep/audiocheck.net_sin_800Hz_-3dBFS_0.3s.wav";
import beep1000 from "./beep/audiocheck.net_sin_1000Hz_-3dBFS_0.3s.wav";
import * as THREE from "three";

class Vario {
  constructor() {
    console.log(" constructor vario");
    const listener = new THREE.AudioListener();
    this.sound = new THREE.Audio(listener);
    setInterval(this.tick, 2000);
  }

  start() {
    this.status = "on";
  }

  stop() {
    this.status = "off";
  }

  tick = () => {
    if (!this.lastRecord) {
      this.lastRecord = this.high;
      console.log("returned");
      return;
    }
    const delta = this.high - this.lastRecord;
    console.log("delta", delta);

    this.lastRecord = this.high;
    console.log(this.status);
    if (this.status === "on") {
      this.play(1);
    }
  };

  play(increment) {
    console.log("play");
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(beep1000, (buffer) => {
      console.log("played");
      this.sound.setBuffer(buffer);
      this.sound.setVolume(0.3);
      this.sound.play();
    });
  }

  updateReading(newHigh) {
    this.high = newHigh;
  }
}

export default Vario;
