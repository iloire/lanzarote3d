import * as THREE from 'three';
import GuiHelper from '../../../utils/gui';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';

const getColorMaterial = (color: number) => {
  return new THREE.MeshPhongMaterial({ color });
};

const mat = getColorMaterial(0xffffff);
const mat_window = getColorMaterial(0x004d1a);
const mat_door = getColorMaterial(0x004d1a);
const mat_door2 = getColorMaterial(0x4d0000);
const mat_roof = getColorMaterial(0xf8f8ff); // Almost white color for roof
const mat_frame = getColorMaterial(0x4a4a4a); // Dark gray for window frames
const mat_modern = getColorMaterial(0xcccccc); // Light gray for modern houses
const mat_modern_window = getColorMaterial(0x000080); // Navy blue for modern windows

export enum HouseType {
  Small,
  Medium,
  Large,
  Modern,
}

export interface HouseOptions extends SimpleComponentOptions {
  type: HouseType;
}

class House extends SimpleThreeComponent {
  private height: number = 20;
  private type: HouseType;

  constructor(options: HouseOptions = { type: HouseType.Small }) {
    const metadata: ComponentMetadata = {
      name: 'House',
      version: '1.0.0',
      description: 'Procedural house component with multiple architectural styles',
      tags: ['scenery', 'building', 'procedural'],
    };

    super(metadata, options);
    this.type = options.type;
    this.height = this.calculateHeight(options.type);

    if (options.scale) {
      this.height *= typeof options.scale === 'number' ? options.scale : 1;
    }
  }

  protected createGeometry(): THREE.BufferGeometry {
    return new THREE.BoxGeometry(20, this.height, 20);
  }

  private calculateHeight(type: HouseType): number {
    switch (type) {
      case HouseType.Large:
        return 30;
      case HouseType.Modern:
        return 25;
      case HouseType.Medium:
      case HouseType.Small:
      default:
        return 20;
    }
  }

  private createWindow(x: number, y: number, z: number): THREE.Group {
    const windowGroup = new THREE.Group();

    // Create window
    const windowGeo = new THREE.BoxGeometry(4, 4, 4);
    const window = new THREE.Mesh(
      windowGeo,
      this.type === HouseType.Modern ? mat_modern_window : mat_window
    );
    window.position.set(x, y, z);

    // Create frame
    const frameGeo = new THREE.BoxGeometry(5, 5, 4.5);
    const frame = new THREE.Mesh(frameGeo, mat_frame);
    frame.position.copy(window.position);

    windowGroup.add(frame);
    windowGroup.add(window);
    return windowGroup;
  }

  private addBasicWindows(mesh: THREE.Object3D): { window: THREE.Mesh; window2: THREE.Mesh } {
    const window1Group = this.createWindow(9, 4, 4);
    const window2Group = this.createWindow(9, 4, -4);
    const window3Group = this.createWindow(0, 4, 9);

    mesh.add(window1Group);
    mesh.add(window2Group);
    mesh.add(window3Group);

    // Return first two windows for GUI compatibility
    const window = window1Group.children.find(
      child => child instanceof THREE.Mesh && child.material !== mat_frame
    ) as THREE.Mesh;
    const window2 = window2Group.children.find(
      child => child instanceof THREE.Mesh && child.material !== mat_frame
    ) as THREE.Mesh;

    return { window, window2 };
  }

  private createRoof(mesh: THREE.Object3D): void {
    if (this.type !== HouseType.Modern) {
      // Flat traditional roof with slight slope (much flatter than cone)
      const roofGeo = new THREE.BoxGeometry(22, 2, 22);
      const roof = new THREE.Mesh(roofGeo, mat_roof);
      roof.position.set(0, this.height / 2 + 1, 0);
      mesh.add(roof);
    } else {
      // Modern flat roof with overhang
      const flatRoofGeo = new THREE.BoxGeometry(22, 1, 22);
      const flatRoof = new THREE.Mesh(flatRoofGeo, mat_modern);
      flatRoof.position.set(0, this.height / 2 + 0.5, 0);
      mesh.add(flatRoof);
    }
  }

  private createDoor(mesh: THREE.Object3D): void {
    const doorGeo = new THREE.BoxGeometry(6, 8, 6);
    const door = new THREE.Mesh(
      doorGeo,
      this.type === HouseType.Modern ? mat_modern_window : mat_door
    );
    door.position.set(8, -5, 0);

    const doorFrameGeo = new THREE.BoxGeometry(7, 9, 6.5);
    const doorFrame = new THREE.Mesh(doorFrameGeo, mat_frame);
    doorFrame.position.copy(door.position);

    mesh.add(doorFrame);
    mesh.add(door);
  }

  public override async load(): Promise<THREE.Object3D> {
    const houseGroup = (await super.load()) as THREE.Mesh;

    // Set material based on house type
    const baseMaterial = this.type === HouseType.Modern ? mat_modern : mat;
    if (houseGroup.material instanceof THREE.Material) {
      houseGroup.material = baseMaterial;
    }

    // Add architectural features
    this.createRoof(houseGroup);
    const { window, window2 } = this.addBasicWindows(houseGroup);
    this.createDoor(houseGroup);
    this.addTypeSpecificFeatures(houseGroup);

    return houseGroup;
  }

  private createHouseMesh(): THREE.Mesh {
    const geo = this.createGeometry();
    const baseMaterial = this.type === HouseType.Modern ? mat_modern : mat;
    const mesh = new THREE.Mesh(geo, baseMaterial);

    // Add architectural features
    this.createRoof(mesh);
    this.addBasicWindows(mesh);
    this.createDoor(mesh);
    this.addTypeSpecificFeatures(mesh);

    return mesh;
  }

  public loadWithGui(gui?: any): Promise<THREE.Object3D> {
    return this.load().then(mesh => {
      if (gui) {
        const { window, window2 } = this.findWindows(mesh);
        if (window && window2) {
          GuiHelper.addLocationGui(gui, 'window', window);
          GuiHelper.addLocationGui(gui, 'window2', window2);
        }
      }
      return mesh;
    });
  }

  private findWindows(mesh: THREE.Object3D): {
    window: THREE.Mesh | null;
    window2: THREE.Mesh | null;
  } {
    let window: THREE.Mesh | null = null;
    let window2: THREE.Mesh | null = null;
    let windowCount = 0;

    mesh.traverse(child => {
      if (
        child instanceof THREE.Mesh &&
        child.material !== mat_frame &&
        (child.material === mat_window || child.material === mat_modern_window)
      ) {
        if (windowCount === 0) window = child;
        else if (windowCount === 1) window2 = child;
        windowCount++;
      }
    });

    return { window, window2 };
  }

  private addTypeSpecificFeatures(mesh: THREE.Object3D): void {
    switch (this.type) {
      case HouseType.Medium:
        this.addMediumHouseFeatures(mesh);
        break;
      case HouseType.Large:
        this.addLargeHouseFeatures(mesh);
        break;
      case HouseType.Modern:
        this.addModernHouseFeatures(mesh);
        break;
      default:
        // Small house has no additional features
        break;
    }
  }

  private addMediumHouseFeatures(mesh: THREE.Object3D): void {
    // Add extension
    const extensionGeo = new THREE.BoxGeometry(15, this.height - 9, 30);
    const extension = new THREE.Mesh(extensionGeo, mat);
    extension.position.set(0, -5, 10);
    mesh.add(extension);

    // Add extension flat roof
    const roofGeo = new THREE.BoxGeometry(18, 2, 18);
    const roof = new THREE.Mesh(roofGeo, mat_roof);
    roof.position.set(0, (this.height - 9) / 2 + 1, 10);
    mesh.add(roof);

    // Add garage door
    this.addGarageDoor(mesh, 5, -7, 18, 6, 8, 8);
  }

  private addLargeHouseFeatures(mesh: THREE.Object3D): void {
    // Add garage
    const garageGeo = new THREE.BoxGeometry(15, this.height - 15, 20);
    const garage = new THREE.Mesh(garageGeo, mat);
    garage.position.set(-10, -7.5, 0);
    mesh.add(garage);

    // Add garage door
    this.addGarageDoor(mesh, -15, -7, 0, 8, 10, 8);
  }

  private addModernHouseFeatures(mesh: THREE.Object3D): void {
    // Add panoramic windows
    const panoramicWindowGeo = new THREE.BoxGeometry(12, 8, 0.5);
    const panoramicWindow = new THREE.Mesh(panoramicWindowGeo, mat_modern_window);
    panoramicWindow.position.set(0, 2, 10);
    mesh.add(panoramicWindow);

    const panoramicFrame = new THREE.Mesh(new THREE.BoxGeometry(13, 9, 1), mat_frame);
    panoramicFrame.position.copy(panoramicWindow.position);
    mesh.add(panoramicFrame);

    // Add decorative pillar
    const pillarGeo = new THREE.BoxGeometry(1, this.height, 1);
    const pillar = new THREE.Mesh(pillarGeo, mat_frame);
    pillar.position.set(-9, 0, 9);
    mesh.add(pillar);

    // Add canopy over door
    const canopyGeo = new THREE.BoxGeometry(8, 0.5, 4);
    const canopy = new THREE.Mesh(canopyGeo, mat_modern);
    canopy.position.set(8, 2, 0);
    mesh.add(canopy);
  }

  private addGarageDoor(
    mesh: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number
  ): void {
    const garageDoorGeo = new THREE.BoxGeometry(width, height, depth);
    const garageDoor = new THREE.Mesh(garageDoorGeo, mat_door2);
    garageDoor.position.set(x, y, z);
    mesh.add(garageDoor);

    const frameWidth = width + 1;
    const frameHeight = height + 1;
    const frameDepth = depth + 0.5;
    const garageDoorFrameGeo = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth);
    const garageDoorFrame = new THREE.Mesh(garageDoorFrameGeo, mat_frame);
    garageDoorFrame.position.copy(garageDoor.position);
    mesh.add(garageDoorFrame);
  }
}

// Legacy compatibility layer for synchronous API
const HouseLegacy = House as any;

// Add legacy load method that returns mesh directly and supports GUI
HouseLegacy.prototype.load = function (gui?: any): THREE.Object3D {
  const mesh = this.createHouseMesh();

  if (gui) {
    const { window, window2 } = this.findWindows(mesh);
    if (window && window2) {
      GuiHelper.addLocationGui(gui, 'window', window);
      GuiHelper.addLocationGui(gui, 'window2', window2);
    }
  }

  return mesh;
};

export default HouseLegacy;
