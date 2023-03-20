import * as THREE from "three";
import GuiHelper from "../utils/gui";
import Models from "../utils/models";
import model from "../models/birds.glb";

const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
const clock = new THREE.Clock();

class Birds {
  currentPointIndex: number = 0;
  path: THREE.Vector3[];
  mesh: THREE.Mesh;
  mixer: any;
  interval: number;

  async load(path: THREE.Vector3[], gui?: any): Promise<THREE.Mesh> {
    this.path = path;
    const gltf: any = await Models.loadGltf(model);
    this.mesh = gltf.scene.children[0];
    this.mesh.scale.set(1, 1, 1);
    const animations = gltf.animations;
    this.mixer = new THREE.AnimationMixer(gltf.scene);
    const animationAction = this.mixer.clipAction(animations[0]);
    animationAction.play();
    if (path.length > 1) {
      this.mesh.position.copy(path[0]);
    }
    this.animate();
    if (gui) {
      GuiHelper.addLocationGui(gui, "birds", this.mesh, {
        min: -10000,
        max: 10000,
      });
    }
    return this.mesh;
  }

  animate() {
    const timer = (Date.now() + Math.random() * 1000) * 0.001;
    const delta = clock.getDelta();
    this.mixer.update(delta);
    if (this.path.length) {
      this.move();
    }
    requestAnimationFrame(() => this.animate());
  }

  position(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  move() {
    const nextPointToTravel = this.path[this.currentPointIndex];
    const velocity = nextPointToTravel.clone().sub(this.position()).normalize();
    this.mesh.position.add(velocity.multiplyScalar(1));

    if (nextPointToTravel.distanceTo(this.position()) < 10) {
      if (this.currentPointIndex < this.path.length - 1) {
        this.currentPointIndex++;
      } else {
        this.currentPointIndex = 0;
      }
    }
  }
}

export default Birds;
