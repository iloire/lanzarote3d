import Cloud, { CloudOptions } from './Cloud';
import * as THREE from 'three';

const randomNumber = (min: number, max: number) => Math.random() * min + max;

const getRandomSign = (): number => {
  const randomBoolean = Math.random() < 0.5;
  return randomBoolean ? 1 : -1;
};

const getRandomCloud = async (options: CloudOptions) => {
  const cloud = await new Cloud(options).load();
  const boundingBox = new THREE.Box3().setFromObject(cloud);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const rndPosOffset = new THREE.Vector3(
    getRandomSign() * random(0.3 * size.x, 1.2 * size.x),
    getRandomSign() * random(0.1 * size.y, 0.2 * size.y),
    getRandomSign() * random(0.3 * size.z, size.z)
  );
  cloud.position.copy(rndPosOffset);
  cloud.rotation.x = -Math.PI / 2;
  cloud.rotation.z = (getRandomSign() * Math.PI) / random(11, 20);
  cloud.rotation.y = (getRandomSign() * Math.PI) / random(38, 45);
  const scale = cloud.scale.x * randomNumber(0.6, 1.1);
  cloud.scale.set(scale, scale, scale);
  return cloud;
};

const random = (min: number, max: number): number => Math.floor(Math.random() * (max - min)) + min;

class Clouds {
  options: CloudOptions;
  private group: THREE.Group | null = null;

  constructor(options: CloudOptions) {
    this.options = options;
  }

  async load(scale: number, pos: THREE.Vector3): Promise<THREE.Object3D> {
    const group = new THREE.Group();
    this.group = group;
    const nClouds = random(2, 6);

    for (let i = 0; i < nClouds; i++) {
      const cloud = await getRandomCloud(this.options);
      group.add(cloud);
      group.position.copy(pos);
    }
    group.scale.set(scale, scale, scale);
    return group;
  }

  /**
   * Update colors of all clouds in this cloud group
   */
  updateColors(newColors: string[]) {
    if (!this.group || !newColors || newColors.length === 0) return;

    console.log('Updating cloud group colors:', newColors);

    // Update options for future reference
    this.options.colors = newColors;

    // Since we don't store Cloud instances, we need to traverse the group
    // and update materials directly on the mesh children
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        // Dispose old material
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }

        // Apply new material (random selection from new colors)
        const materialIndex = Math.floor(Math.random() * newColors.length);
        child.material = new THREE.MeshLambertMaterial({ color: newColors[materialIndex] });
      }
    });
  }
}

export default Clouds;
