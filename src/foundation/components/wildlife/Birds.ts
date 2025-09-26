import * as THREE from 'three';
import GuiHelper from '../../utils/gui';
import Models from '../../utils/models';
import model from '../../../../assets/foundation/models/environment/birds.glb';
import AutoFlier, { AutoFlierOptions } from '../../types/auto-flier';

const clock = new THREE.Clock();

export interface BirdsOptions extends AutoFlierOptions {
  scale?: number;
  animationSpeed?: number;
}

class Birds extends AutoFlier {
  mixer: THREE.AnimationMixer | null = null;
  interval: number;
  private scale: number = 1;
  private animationSpeed: number = 1;

  constructor(options: BirdsOptions = {}) {
    // Configure bird-specific flight behavior
    super({
      speed: options.speed ?? 2, // Moderate flying speed
      arrivalThreshold: options.arrivalThreshold ?? 15, // Larger threshold for natural turns
      smoothRotation: options.smoothRotation ?? true, // Smooth banking turns
      rotationSpeed: options.rotationSpeed ?? 0.08, // Realistic bird turning speed
      forwardAxis: options.forwardAxis ?? '-z', // Assuming bird model faces -Z direction
      ...options,
    });

    this.scale = options.scale ?? 1;
    this.animationSpeed = options.animationSpeed ?? 1;
  }

  async load(path: THREE.Vector3[], gui?: any): Promise<THREE.Mesh> {
    this.path = path;
    const gltf = await Models.loadGltf(model);
    this.mesh = gltf.scene.children[0];

    // Apply custom scale
    this.mesh.scale.set(this.scale, this.scale, this.scale);

    // Set up animations
    const animations = gltf.animations;
    if (animations && animations.length > 0 && animations[0]) {
      this.mixer = new THREE.AnimationMixer(gltf.scene);
      const animationAction = this.mixer.clipAction(animations[0]);
      animationAction.setDuration(animationAction.getClip().duration / this.animationSpeed);
      animationAction.play();
    }

    // Position at start of path
    if (path.length > 0 && path[0]) {
      this.mesh.position.copy(path[0]);
      // Reset to start of path
      this.resetPath();
    }

    this.animate();

    if (gui) {
      GuiHelper.addLocationGui(gui, 'Birds', this.mesh, {
        min: -10000,
        max: 10000,
      });
    }

    console.log(
      `🐦 Birds loaded with ${path.length} waypoints, forward axis: ${this.getForwardAxis()}`
    );
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
      this.mixer?.update(delta);
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
      this.mixer.stopAllAction();
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
