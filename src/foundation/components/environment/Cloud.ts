import * as THREE from 'three';
import { rndBetween, rndIntBetween } from '../../utils/math';

const generateCloudPart = (radius: number, scale: number, material: THREE.Material) => {
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
  // Create materials for ALL available colors, not just the first 3
  const materials: THREE.MeshLambertMaterial[] = [];
  if (options.colors && options.colors.length > 0) {
    // Use all provided colors from the theme
    options.colors.forEach(color => {
      materials.push(new THREE.MeshLambertMaterial({ color }));
    });
  } else {
    // Fallback to default grayscale if no colors provided
    materials.push(new THREE.MeshLambertMaterial({ color: 0xffffff }));
    materials.push(new THREE.MeshLambertMaterial({ color: 0x666666 }));
    materials.push(new THREE.MeshLambertMaterial({ color: 0x999999 }));
  }

  const radius = 40;
  const r = rndBetween;
  const nCloudParts = rndIntBetween(3, 8);
  const group = new THREE.Group();

  // Randomly decide if this cloud should be monochrome or multi-colored
  const useMonochrome = Math.random() < 0.3; // 30% chance of single-color cloud
  const monochromeIndex = rndIntBetween(0, materials.length - 1);

  for (let i = 0; i < nCloudParts; i++) {
    // Each cloud part can have a different material for more color variety
    const materialIndex = useMonochrome ? monochromeIndex : rndIntBetween(0, materials.length - 1);
    const material = materials[materialIndex];
    if (!material) continue; // Skip if material not found;

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

/** How far the parts breathe: their scale by ±5 %, their offset from the cloud's centre by ±10 % */
const PART_SCALE_SWING = 0.05;
const PART_OFFSET_SWING = 0.1;
/** The whole cloud bobs ±60 units over about a minute */
const BOB_HEIGHT = 60;
const BOB_RATE = 0.1;

type PartRest = {
  part: THREE.Object3D;
  scale: THREE.Vector3;
  position: THREE.Vector3;
  phase: number;
};

/**
 * All clouds move on one shared requestAnimationFrame, and the motion is a pure function of
 * time around each piece's rest pose, so it neither drifts nor depends on the frame rate
 */
const activeClouds = new Set<Cloud>();
let tickerId: number | null = null;
const tick = (now: number) => {
  activeClouds.forEach(cloud => cloud.update(now / 1000));
  tickerId = activeClouds.size > 0 ? requestAnimationFrame(tick) : null;
};

export type CloudOptions = {
  colors?: string[];
};

class Cloud {
  options: CloudOptions;
  private mesh: THREE.Object3D | null = null;
  private rest: PartRest[] = [];
  // Read on the first update: whoever loads the cloud places it after load() returns
  private restY: number | null = null;
  private readonly phase = Math.random() * 100;

  constructor(options: CloudOptions) {
    this.options = options;
  }

  async load(): Promise<THREE.Object3D> {
    this.mesh = await generateCloud(this.options);
    this.rest = this.mesh.children.map(part => ({
      part,
      scale: part.scale.clone(),
      position: part.position.clone(),
      phase: Math.random() * Math.PI * 2,
    }));
    this.animate();
    return this.mesh;
  }

  animate() {
    if (!this.mesh) return;
    activeClouds.add(this);
    if (tickerId === null) tickerId = requestAnimationFrame(tick);
  }

  stop() {
    activeClouds.delete(this);
  }

  /** Poses the cloud for `time` in seconds */
  update(time: number) {
    if (!this.mesh) return;
    if (this.restY === null) this.restY = this.mesh.position.y;
    const t = time + this.phase;
    this.mesh.position.y = this.restY + Math.sin(t * BOB_RATE) * BOB_HEIGHT;
    this.rest.forEach(({ part, scale, position, phase }) => {
      part.scale.copy(scale).multiplyScalar(1 + Math.sin(t * 0.7 + phase) * PART_SCALE_SWING);
      part.position
        .copy(position)
        .multiplyScalar(1 + Math.sin(t * 0.4 + phase * 2) * PART_OFFSET_SWING);
    });
  }

  /**
   * Update cloud colors by recreating materials with new colors
   */
  updateColors(newColors: string[]) {
    if (!this.mesh || !newColors || newColors.length === 0) return;

    // Create new materials with the new colors
    const newMaterials: THREE.MeshLambertMaterial[] = [];
    newColors.forEach(color => {
      newMaterials.push(new THREE.MeshLambertMaterial({ color }));
    });

    // Update each cloud part's material
    this.mesh.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        // Dispose old material
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material?.dispose();
        }

        // Apply new material (random selection from new colors)
        const materialIndex = Math.floor(Math.random() * newMaterials.length);
        const newMaterial = newMaterials[materialIndex];
        if (newMaterial) {
          child.material = newMaterial;
        }
      }
    });

    // Update stored options for future reference
    this.options.colors = newColors;
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
