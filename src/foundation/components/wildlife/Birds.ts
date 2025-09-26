import * as THREE from "three";
import GuiHelper from "../../utils/gui";
import Models from "../../utils/models";
import model from "../../../../assets/foundation/models/environment/birds.glb";
import AutoFlier from "../../types/auto-flier";

const clock = new THREE.Clock();

class Birds extends AutoFlier {
  mixer: THREE.AnimationMixer | null = null;
  interval: number;

  async load(path: THREE.Vector3[], gui?: any): Promise<THREE.Mesh> {
    this.path = path;
    const gltf = await Models.loadGltf(model);
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

  private animationId: number | null = null;
  private isAnimating: boolean = false;

  animate() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.startAnimation();
    }
  }

  private startAnimation() {
    const animateLoop = () => {
      if (!this.isAnimating) return;

      const delta = clock.getDelta();
      this.mixer.update(delta);
      if (this.path.length) {
        this.move();
      }

      this.animationId = requestAnimationFrame(animateLoop);
    };
    animateLoop();
  }

  stop() {
    this.isAnimating = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  dispose() {
    this.stop();
    // Clean up mixer and mesh
    if (this.mixer) {
      this.mixer.stopAllActions();
    }
    if (this.mesh) {
      this.mesh.geometry?.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(material => material.dispose());
      } else {
        this.mesh.material?.dispose();
      }
    }
  }

  override position(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
}

export default Birds;
