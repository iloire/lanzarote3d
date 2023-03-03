import * as THREE from "three";
import Models from "../utils/models";
import model from "../models/birds.glb";

const clock = new THREE.Clock();

const animate = (mesh, scale, mixer) => {
  const timer = (Date.now() + Math.random() * 1000) * 0.001;
  mesh.position.y = mesh.position.y + Math.sin(timer) * 1;
  mesh.position.x += 0.2 * scale;
  mesh.position.z -= 0.1 * scale;
  const delta = clock.getDelta();
  mixer.update(delta);
  requestAnimationFrame(() => animate(mesh, scale, mixer));
};

class Birds {
  mesh: THREE.Mesh;
  async loadModel(scale: number): Promise<THREE.Mesh> {
    const gltf: any = await Models.loadGltf(model);
    const mesh = gltf.scene.children[0];
    mesh.scale.set(scale, scale, scale);
    const animations = gltf.animations;
    const mixer = new THREE.AnimationMixer(gltf.scene);
    const animationAction = mixer.clipAction(animations[0]);
    animationAction.play();
    animate(mesh, scale, mixer);
    this.mesh = mesh;
    return mesh;
  }
}

export default Birds;
