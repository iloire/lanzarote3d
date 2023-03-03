import * as THREE from "three";
import Models from "../utils/models";
import model from "../models/birds.glb";

const clock = new THREE.Clock();

const animate = (mesh, mixer) => {
  const timer = (Date.now() + Math.random() * 1000) * 0.001;
  mesh.position.y = mesh.position.y + Math.sin(timer) * 1;
  mesh.position.x += 2;
  const delta = clock.getDelta();
  mixer.update(delta);
  requestAnimationFrame(() => animate(mesh, mixer));
};

class Bird {
  mesh: THREE.Mesh;
  async loadModel(scale: number): Promise<THREE.Mesh> {
    const gltf: any = await Models.loadGltf(model);
    const mesh = gltf.scene.children[0];
    mesh.scale.set(scale, scale, scale);
    const animations = gltf.animations;
    const mixer = new THREE.AnimationMixer(gltf.scene);
    const animationAction = mixer.clipAction(animations[0]);
    animationAction.play();
    animate(mesh, mixer);
    this.mesh = mesh;
    return mesh;
  }
}

export default Bird;
