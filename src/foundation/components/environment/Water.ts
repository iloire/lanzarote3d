import * as THREE from "three";
import { Water as WaterEffect } from "three/examples/jsm/objects/Water";
import waterTexture from "../../../../assets/foundation/textures/environment/waternormals.jpg";
import Models from "../../utils/models";

const USE_PLAIN_WATER = true;

export type WaterOptions = {
  size: number;
}

export default class Water {
  options: WaterOptions;
  private animationId: number | null = null;
  private isAnimating: boolean = false;
  private waterMesh: THREE.Mesh | WaterEffect | null = null;

  constructor(options: WaterOptions) {
    this.options = options;
  }

  load(sunPosition: THREE.Vector3) {
    const waterGeometry = new THREE.PlaneGeometry(this.options.size, this.options.size);
    if (USE_PLAIN_WATER) {
      const mat = new THREE.MeshLambertMaterial({ color: 0x000511 });
      mat.transparent = true;
      mat.opacity = 0.6;
      this.waterMesh = new THREE.Mesh(waterGeometry, mat);
      this.waterMesh.rotation.x = -Math.PI / 2;
      return this.waterMesh;
    } else {
      const water = new WaterEffect(waterGeometry, {
        // textureWidth: 512,
        // textureHeight: 512,
        waterNormals: new THREE.TextureLoader(Models.manager).load(
          waterTexture,
          (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          }
        ),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x0072ff,
        distortionScale: 4,
      });
      water.rotation.x = -Math.PI / 2;
      water.material.uniforms["sunDirection"]?.value
        ?.copy(sunPosition)
        ?.normalize();
      water.receiveShadow = true;
      this.waterMesh = water;
      this.animate();
      return water;
    }
  }

  animate() {
    if (!this.isAnimating && this.waterMesh && !USE_PLAIN_WATER) {
      this.isAnimating = true;
      this.startAnimation();
    }
  }

  private startAnimation() {
    const animateLoop = () => {
      if (!this.isAnimating || !this.waterMesh) return;

      const water = this.waterMesh as WaterEffect;
      if (water.material.uniforms["time"]?.value !== undefined) {
        water.material.uniforms["time"].value += 1.0 / 60.0;
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
    // Clean up mesh and materials if needed
    if (this.waterMesh) {
      this.waterMesh.geometry?.dispose();
      if (Array.isArray(this.waterMesh.material)) {
        this.waterMesh.material.forEach(material => material.dispose());
      } else {
        this.waterMesh.material?.dispose();
      }
    }
  }

  // Theme support methods

  /**
   * Apply water theme settings to the water mesh
   */
  applyTheme(waterTheme: any) {
    if (!this.waterMesh || !this.waterMesh.material) return;

    const material = this.waterMesh.material as THREE.MeshLambertMaterial;

    if (waterTheme.color) {
      material.color = new THREE.Color(waterTheme.color);
    }

    if (waterTheme.opacity !== undefined) {
      material.opacity = waterTheme.opacity;
      material.transparent = waterTheme.opacity < 1.0;
    }

    material.needsUpdate = true;

    // Handle animation based on theme
    if (waterTheme.animated !== undefined) {
      if (waterTheme.animated && !this.isAnimating) {
        this.isAnimating = true;
        this.startAnimation();
      } else if (!waterTheme.animated && this.isAnimating) {
        this.stop();
      }
    }
  }

  /**
   * Get current water mesh for external theme application
   */
  getMesh(): THREE.Mesh | WaterEffect | null {
    return this.waterMesh;
  }
}
