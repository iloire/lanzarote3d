import * as THREE from "three";
import wind1 from "./wind-howl-01.mp3";

const Wind = {
  load: (camera) => {
    const listener = new THREE.AudioListener();
    camera.add(listener);

    // create a global audio source
    const sound = new THREE.Audio(listener);

    // load a sound and set it as the Audio object's buffer
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load(wind1, function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.2);
      sound.play();
    });
  },
};

export default Wind;
