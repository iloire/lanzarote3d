import * as THREE from "three";
import wind1 from "./wind/wind-howl-01.mp3";
import wind2 from "./wind/hurricane-01.mp3";
import music from "./music/the-beat-of-nature-122841.mp3";

class BackgroundSound {
  wind1: THREE.Audio;
  wind2: THREE.Audio;
  music: THREE.Audio;
  enabled: boolean;
  paused: boolean;
  volume: number = 0.3;

  constructor() {
    this.load();
  }

  isPlaying() {
    return [this.wind1, this.wind2, this.music].every((i) => i.isPlaying);
  }

  loadSound(file, volume?: number) {
    const listener = new THREE.AudioListener();
    const sound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    if (volume) {
      this.volume = volume;
    }
    audioLoader.load(file, (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(this.volume);
    });
    return sound;
  }

  load() {
    this.wind1 = this.loadSound(wind1, 0.2);
    this.wind2 = this.loadSound(wind2, 0.2);
    this.music = this.loadSound(music, 0.3);
  }

  toggle() {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  pause() {
    this.paused = true;
    this.wind1.pause();
    this.wind2.pause();
    this.music.pause();
  }

  play() {
    this.wind1.play();
    this.wind2.play();
    this.music.play();
    this.enabled = true;
  }

  stop() {
    if (this.enabled) {
      this.wind1.stop();
      this.wind2.stop();
      this.music.stop();
      this.enabled = false;
    }
  }
}

export default BackgroundSound;
