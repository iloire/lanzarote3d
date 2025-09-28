import * as THREE from 'three';
import GuiHelper from '../../utils/gui';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';

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

export interface IglooOptions extends SimpleComponentOptions {
  size: IglooSize;
}

class Igloo extends SimpleThreeComponent {
  private radius: number = 15;
  private height: number = 12;
  private size: IglooSize;

  constructor(options: IglooOptions | IglooSize = IglooSize.Small) {
    const metadata: ComponentMetadata = {
      name: 'Igloo',
      version: '1.0.0',
      description: 'Procedural igloo component with ice blocks, entrance, and snow details',
      tags: ['scenery', 'building', 'arctic', 'procedural']
    };

    // Handle both old (size only) and new (options object) constructor signatures
    const iglooOptions: IglooOptions = typeof options === 'object' && 'size' in options
      ? options
      : { size: options as IglooSize };

    super(metadata, iglooOptions);
    this.size = iglooOptions.size;
    this.calculateDimensions(iglooOptions.size);

    if (iglooOptions.scale) {
      const scaleFactor = typeof iglooOptions.scale === 'number' ? iglooOptions.scale : 1;
      this.radius *= scaleFactor;
      this.height *= scaleFactor;
    }
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Create the main dome geometry
    return new THREE.SphereGeometry(this.radius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  }

  private calculateDimensions(size: IglooSize): void {
    switch (size) {
      case IglooSize.Medium:
        this.radius = 20;
        this.height = 16;
        break;
      case IglooSize.Large:
        this.radius = 25;
        this.height = 20;
        break;
      case IglooSize.Small:
      default:
        this.radius = 15;
        this.height = 12;
        break;
    }
  }

  private addIceBlocks(mesh: THREE.Object3D): void {
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

  private addEntrance(mesh: THREE.Object3D): void {
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

  private addSnowDetails(mesh: THREE.Object3D): void {
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

  public override async load(): Promise<THREE.Object3D> {
    const iglooGroup = new THREE.Group();

    // Add main dome (using the base geometry but with proper material)
    const dome = await super.load() as THREE.Mesh;
    if (dome.material instanceof THREE.Material) {
      dome.material = mat_ice;
    }
    dome.position.y = -this.height / 2;
    iglooGroup.add(dome);

    // Add architectural features
    this.addIceBlocks(iglooGroup);
    this.addEntrance(iglooGroup);
    this.addSnowDetails(iglooGroup);
    this.addChimney(iglooGroup);

    return iglooGroup;
  }

  private createIglooGroup(): THREE.Group {
    const group = new THREE.Group();

    // Main dome structure
    const domeGeo = this.createGeometry();
    const dome = new THREE.Mesh(domeGeo, mat_ice);
    dome.position.y = -this.height / 2;
    group.add(dome);

    // Add architectural features
    this.addIceBlocks(group);
    this.addEntrance(group);
    this.addSnowDetails(group);
    this.addChimney(group);

    return group;
  }

  public loadWithGui(gui?: any): Promise<THREE.Object3D> {
    return this.load().then(igloo => {
      if (gui) {
        GuiHelper.addLocationGui(gui, 'Igloo', igloo);
      }
      return igloo;
    });
  }

  private addChimney(mesh: THREE.Object3D): void {
    // Add chimney hole (small opening at top)
    const holeGeo = new THREE.CylinderGeometry(1, 1.5, 2, 8);
    const hole = new THREE.Mesh(holeGeo, mat_entrance);
    hole.position.set(0, this.height / 4, 0);
    mesh.add(hole);
  }
}

// Legacy compatibility layer for synchronous API
const IglooLegacy = Igloo as any;

// Add legacy load method that returns group directly and supports GUI
IglooLegacy.prototype.load = function(gui?: any): THREE.Object3D {
  const igloo = this.createIglooGroup();

  if (gui) {
    GuiHelper.addLocationGui(gui, 'Igloo', igloo);
  }

  return igloo;
};

export default IglooLegacy;