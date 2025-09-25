import * as THREE from "three";
import GuiHelper from "../foundation/utils/gui";
import Models from "../foundation/utils/models";
import model from "../../assets/foundation/models/environment/birds.glb";
import AutoFlier from "../foundation/types/auto-flier";

const clock = new THREE.Clock();

class Birds extends AutoFlier {
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
      GuiHelper.addLocationGui(gui, "Birds", this.mesh, {
        min: -10000,
        max: 10000,
      });
    }
    return this.mesh;
  }

  animate() {
    const delta = clock.getDelta();
    this.mixer.update(delta);
    if (this.path.length) {
      this.move();
    }
    requestAnimationFrame(() => this.animate());
  }

  override position(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
}

export default Birds;
