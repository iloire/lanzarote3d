import * as THREE from "three";
import wind1 from "./wind/wind-howl-01.mp3";
import wind2 from "./wind/hurricane-01.mp3";
import music from "./music/the-beat-of-nature-122841.mp3";

const play = (camera, file, volume) => {
  const listener = new THREE.AudioListener();
  camera.add(listener);

  // create a global audio source
  const sound = new THREE.Audio(listener);

  // load a sound and set it as the Audio object's buffer
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(file, function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(volume || 0.3);
    sound.play();
  });
};

const BackgroundSound = {
  load: (camera) => {
    play(camera, wind1, 0.3);
    play(camera, wind2, 0.3);
    play(camera, music, 0.2);
  },
};

export default BackgroundSound;
