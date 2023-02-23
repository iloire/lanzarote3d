import * as THREE from "three";
import wind1 from "./wind/wind-howl-01.mp3";
import wind2 from "./wind/hurricane-01.mp3";
import music from "./music/the-beat-of-nature-122841.mp3";

class BackgroundSound {
  wind1: THREE.Audio;
  wind2: THREE.Audio;
  music: THREE.Audio;
  playing: boolean;

  constructor() {
    this.load();
  }

  loadSound(file, volume) {
    const listener = new THREE.AudioListener();
    const sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(file, function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(volume || 0.3);
    });
    return sound;
  }

  load() {
    this.wind1 = this.loadSound(wind1, 0.3);
    this.wind2 = this.loadSound(wind2, 0.3);
    this.music = this.loadSound(music, 0.2);
  }

  toggle() {
    if (this.playing) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    this.wind1.play();
    this.wind2.play();
    this.music.play();
    this.playing = true;
  }

  stop() {
    this.wind1.stop();
    this.wind2.stop();
    this.music.stop();
    this.playing = false;
  }
}

export default BackgroundSound;
