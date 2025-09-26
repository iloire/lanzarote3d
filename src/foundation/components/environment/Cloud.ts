import * as THREE from "three";
import { rndBetween, rndIntBetween } from "../../utils/math";
import { animator } from "../../systems/animation/SimpleAnimator";

const generateCloudPart = (
  radius: number,
  scale: number,
  material: THREE.Material
) => {
  const geo_cloudPart = new THREE.IcosahedronGeometry(radius, 0);
  const cloudPart = new THREE.Mesh(geo_cloudPart, material);
  const scaleX = rndBetween(scale * 0.9, scale * 1.1);
  const scaleY = rndBetween(scale * 0.9, scale * 1.1);
  const scaleZ = rndBetween(scale * 0.9, scale * 1.1);
  cloudPart.scale.set(scaleX, scaleY, scaleZ);
  cloudPart.rotation.z = -0.5;
  cloudPart.rotation.x = -0.2;
  cloudPart.castShadow = true;
  return cloudPart;
};

const generateCloud = async (options: CloudOptions): Promise<THREE.Object3D> => {
  const mat_cloud = new THREE.MeshLambertMaterial({ color: options.colors && options.colors[0] || 0xffffff });
  const mat_cloud2 = new THREE.MeshLambertMaterial({ color: options.colors && options.colors[1] || 0x666666 });
  const mat_cloud3 = new THREE.MeshLambertMaterial({ color: options.colors && options.colors[2] || 0x999999 });
  const materials = [mat_cloud, mat_cloud2, mat_cloud3];

  const radius = 40;
  const r = rndBetween;
  const n = rndIntBetween(3, 8);
  const group = new THREE.Group();

  const materialIndex = rndIntBetween(0, materials.length - 1);
  const material = materials[materialIndex] || materials[0]!; // Fallback to first material, non-null assertion

  for (let i = 0; i < n; i++) {
    const scale = r(i * 0.9, i * 1.1);
    const posX = 1.7 * radius * r(-1 * i, i);
    const posY = 0.3 * radius * r(-1 * i, i);
    const posZ = 1.2 * radius * r(-1 * i, i);
    const p = generateCloudPart(radius, scale, material);
    p.position.set(posX, posY, posZ);
    group.add(p);
  }

  return group;
};

const tweakSize = (mesh: THREE.Object3D, interval: number) => {
  const min = 0.95,
    max = 1.05;
  const multiplier = rndBetween(min, max);
  const scaleX = mesh.scale.x * multiplier;
  const scaleY = mesh.scale.y * multiplier;
  const scaleZ = mesh.scale.z * multiplier;

  const startScale = mesh.scale.clone();
  const targetPosition = new THREE.Vector3(scaleX, scaleY, scaleZ);

  animator.animate(`cloud-scale-${Math.random()}`, interval, (progress) => {
    mesh.scale.lerpVectors(startScale, targetPosition, progress);
  });
};

const tweakPos = (mesh: THREE.Object3D, interval: number) => {
  const min = 0.9,
    max = 1.1;
  const multiplier = rndBetween(min, max);
  const posX = mesh.position.x * multiplier;
  const posY = mesh.position.y * multiplier;
  const posZ = mesh.position.z * multiplier;

  const startPosition = mesh.position.clone();
  const targetPosition = new THREE.Vector3(posX, posY, posZ);

  animator.animate(`cloud-pos-${Math.random()}`, interval, (progress) => {
    mesh.position.lerpVectors(startPosition, targetPosition, progress);
  });
};

export type CloudOptions = {
  colors?: string[]
}

class Cloud {
  options: CloudOptions;
  private interval: number | null = null;
  private animationId: number | null = null;
  private isAnimating: boolean = false;
  private mesh: THREE.Object3D | null = null;

  constructor(options: CloudOptions) {
    this.options = options;
  }

  async load(): Promise<THREE.Object3D> {
    this.mesh = await generateCloud(this.options);
    const interval = 3000;
    this.interval = setInterval(() => {
      if (this.mesh) {
        this.mesh.children.forEach((m) => {
          tweakSize(m, interval);
          tweakPos(m, interval);
        });
      }
    }, interval) as unknown as number;

    this.animate();
    return this.mesh;
  }

  animate() {
    if (!this.isAnimating && this.mesh) {
      this.isAnimating = true;
      this.startAnimation();
    }
  }

  private startAnimation() {
    const animateLoop = () => {
      if (!this.isAnimating || !this.mesh) return;

      const timer = (Date.now() + Math.random() * 1000) * 0.0001;
      this.mesh.position.y = this.mesh.position.y + Math.sin(timer) * 0.1;

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
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  dispose() {
    this.stop();
    // Clean up mesh and materials
    if (this.mesh) {
      this.mesh.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    }
  }
}

export default Cloud;
