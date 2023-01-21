import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

const manager = new THREE.LoadingManager();
const loader = new GLTFLoader(manager);

const Models = {
  load: (scene, model, scale, pos, rotation, cb) => {
    loader.load(model, (gltf) => {
      const mesh = gltf.scene.children[0];
      mesh.scale.set(scale, scale, scale);
      mesh.position.set(pos.x, pos.y, pos.z);
      if (rotation && rotation.x) mesh.rotation.x = rotation.x;
      mesh.castShadow = true;
      scene.add(mesh);
      cb && cb(mesh);
    });
  },
};

export default Models;
