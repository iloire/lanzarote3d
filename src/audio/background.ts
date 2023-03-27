import * as THREE from "three";
import wind1 from "./wind/wind-howl-01.mp3";
import wind2 from "./wind/hurricane-01.mp3";
import music from "./music/the-beat-of-nature-122841.mp3";

class BackgroundSound {
  wind1: THREE.Audio;
  wind2: THREE.Audio;
  music: THREE.Audio;
  enabled: boolean;
  sound_enabled: boolean;

  constructor(sound_enabled: boolean) {
    this.sound_enabled = sound_enabled;
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
    this.wind1 = this.loadSound(wind1, 0.2);
    this.wind2 = this.loadSound(wind2, 0.2);
    this.music = this.loadSound(music, 0.3);
  }

  toggle() {
    if (this.enabled) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    if (this.sound_enabled) {
      this.wind1.play();
      this.wind2.play();
      this.music.play();
      this.enabled = true;
    }
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
