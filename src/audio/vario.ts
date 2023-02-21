// import beep200 from "./beep/audiocheck.net_sin_200Hz_-3dBFS_0.3s.wav";
// import beep800 from "./beep/audiocheck.net_sin_800Hz_-3dBFS_0.3s.wav";
// import beep1000 from "./beep/audiocheck.net_sin_1000Hz_-3dBFS_0.3s.wav";
import * as THREE from "three";

class Vario extends THREE.EventDispatcher {

  sound: any;
  pg: any;
  status: any;
  lastRecord: number;
  high: number;

  constructor(pg) {
    super();
    const listener = new THREE.AudioListener();
    this.sound = new THREE.Audio(listener);
    this.pg = pg;
    setInterval(this.tick, 2000);
  }

  start() {
    this.status = "on";
    this.dispatchEvent({ type: "status", status: "on" });
  }

  stop() {
    this.status = "off";
    this.dispatchEvent({ type: "status", status: "off" });
  }

  tick = () => {
    if (!this.lastRecord) {
      this.lastRecord = this.high;
      return;
    }
    const delta = this.high - this.lastRecord;

    this.dispatchEvent({ type: "delta", delta });
    this.lastRecord = this.high;
    console.log(this.status);
    if (this.status === "on") {
      this.play(1);
    }
  };

  play(increment) {
    const audioLoader = new THREE.AudioLoader();
    // audioLoader.load(beep1000, (buffer) => {
    //   this.sound.setBuffer(buffer);
    //   this.sound.setVolume(0.01);
    //   // this.sound.play();
    // });
  }

  updateReading(altitude) {
    this.dispatchEvent({ type: "altitude", altitude });
    this.high = altitude;
  }
}

export default Vario;
