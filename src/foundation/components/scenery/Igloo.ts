import * as THREE from 'three';
import GuiHelper from '../../utils/gui';

const getColorMaterial = (color: number) => {
  return new THREE.MeshPhongMaterial({ color });
};

const mat_ice = getColorMaterial(0xf0f8ff); // Alice blue for ice blocks
const mat_entrance = getColorMaterial(0x4682b4); // Steel blue for entrance
const mat_dark_ice = getColorMaterial(0xe6f3ff); // Slightly darker ice for contrast
const mat_snow = getColorMaterial(0xfffafa); // Snow white

export enum IglooSize {
  Small,
  Medium,
  Large,
}

class Igloo {
  radius: number = 15;
  height: number = 12;
  size: IglooSize;

  constructor(size: IglooSize) {
    this.size = size;
    // Adjust dimensions based on igloo size
    if (size === IglooSize.Medium) {
      this.radius = 20;
      this.height = 16;
    } else if (size === IglooSize.Large) {
      this.radius = 25;
      this.height = 20;
    }
  }

  private addIceBlocks(mesh: THREE.Group) {
    // Add ice block texture by creating small cube details
    const blockSize = this.radius / 8;
    const rows = Math.floor(this.height / blockSize);

    for (let row = 0; row < rows; row++) {
      const y = -this.height / 2 + row * blockSize;
      const currentRadius = this.radius * (1 - (row / rows) * 0.3); // Taper toward top
      const blocksInRow = Math.floor(currentRadius / blockSize * 2);

      for (let i = 0; i < blocksInRow; i++) {
        const angle = (i / blocksInRow) * Math.PI * 2;
        const x = Math.cos(angle) * currentRadius;
        const z = Math.sin(angle) * currentRadius;

        // Alternate ice colors for block pattern
        const blockMaterial = (row + i) % 2 === 0 ? mat_ice : mat_dark_ice;
        const blockGeo = new THREE.BoxGeometry(blockSize * 0.8, blockSize * 0.8, blockSize * 0.4);
        const block = new THREE.Mesh(blockGeo, blockMaterial);
        block.position.set(x, y, z);
        block.lookAt(new THREE.Vector3(0, y, 0)); // Face inward
        mesh.add(block);
      }
    }
  }

  private addEntrance(mesh: THREE.Group) {
    // Create tunnel entrance
    const tunnelGeo = new THREE.CylinderGeometry(3, 4, 8, 8);
    const tunnel = new THREE.Mesh(tunnelGeo, mat_entrance);
    tunnel.rotation.z = Math.PI / 2;
    tunnel.position.set(this.radius - 2, -this.height / 3, 0);
    mesh.add(tunnel);

    // Add entrance archway
    const archGeo = new THREE.TorusGeometry(4, 1, 8, 16, Math.PI);
    const arch = new THREE.Mesh(archGeo, mat_ice);
    arch.rotation.z = Math.PI;
    arch.position.set(this.radius + 2, -this.height / 3 + 2, 0);
    mesh.add(arch);
  }

  private addSnowDetails(mesh: THREE.Group) {
    // Add snow patches around the base
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const distance = this.radius + 2 + Math.random() * 3;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      const snowGeo = new THREE.SphereGeometry(1 + Math.random() * 2, 8, 6);
      const snow = new THREE.Mesh(snowGeo, mat_snow);
      snow.position.set(x, -this.height / 2 - 0.5, z);
      snow.scale.y = 0.3; // Flatten the snow patches
      mesh.add(snow);
    }

    // Add icicles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * this.radius * 0.9;
      const z = Math.sin(angle) * this.radius * 0.9;

      const icicleGeo = new THREE.ConeGeometry(0.2 + Math.random() * 0.3, 2 + Math.random() * 3, 6);
      const icicle = new THREE.Mesh(icicleGeo, mat_ice);
      icicle.position.set(x, this.height / 3, z);
      mesh.add(icicle);
    }
  }

  load(gui?: any): THREE.Group {
    const group = new THREE.Group();

    // Main dome structure
    const domeGeo = new THREE.SphereGeometry(this.radius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, mat_ice);
    dome.position.y = -this.height / 2;
    group.add(dome);

    // Add ice block details
    this.addIceBlocks(group);

    // Add entrance tunnel
    this.addEntrance(group);

    // Add snow and ice details
    this.addSnowDetails(group);

    // Add chimney hole (small opening at top)
    const holeGeo = new THREE.CylinderGeometry(1, 1.5, 2, 8);
    const hole = new THREE.Mesh(holeGeo, mat_entrance);
    hole.position.set(0, this.height / 4, 0);
    group.add(hole);

    if (gui) {
      GuiHelper.addLocationGui(gui, 'Igloo', group);
    }

    return group;
  }
}

export default Igloo;