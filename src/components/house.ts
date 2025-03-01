import * as THREE from "three";
import GuiHelper from "../utils/gui";

const getColorMaterial = (color: number) => {
  return new THREE.MeshPhongMaterial({ color });
};

const mat = getColorMaterial(0xffffff);
const mat_window = getColorMaterial(0x004d1a);
const mat_door = getColorMaterial(0x004d1a);
const mat_door2 = getColorMaterial(0x4d0000);
const mat_roof = getColorMaterial(0x8B4513);  // Brown color for roof
const mat_frame = getColorMaterial(0x4a4a4a);  // Dark gray for window frames
const mat_modern = getColorMaterial(0xCCCCCC); // Light gray for modern houses
const mat_modern_window = getColorMaterial(0x000080); // Navy blue for modern windows
const mat_balcony = getColorMaterial(0x808080); // Gray for balcony

export enum HouseType {
  Small,
  Medium,
  Large,
  Modern,
}

class House {
  height: number = 20;
  type: HouseType;

  constructor(type: HouseType) {
    this.type = type;
    // Adjust height based on house type
    if (type === HouseType.Large) {
      this.height = 30;
    } else if (type === HouseType.Modern) {
      this.height = 25;
    }
  }

  private addBasicWindows(mesh: THREE.Mesh) {
    // Window with frame
    const windowGeo = new THREE.BoxGeometry(4, 4, 4);
    const window = new THREE.Mesh(windowGeo, this.type === HouseType.Modern ? mat_modern_window : mat_window);
    window.position.set(9, 4, 4);
    
    // Add frame around window
    const frameGeo = new THREE.BoxGeometry(5, 5, 4.5);
    const frame = new THREE.Mesh(frameGeo, mat_frame);
    frame.position.copy(window.position);
    mesh.add(frame);

    const window2 = window.clone();
    const frame2 = frame.clone();
    window2.position.set(9, 4, -4);
    frame2.position.copy(window2.position);
    mesh.add(frame2);

    const window3 = window.clone();
    const frame3 = frame.clone();
    window3.position.set(0, 4, 9);
    frame3.position.copy(window3.position);
    mesh.add(frame3);
    mesh.add(window);
    mesh.add(window2);
    mesh.add(window3);
    return { window, window2 };
  }

  load(gui?: any): THREE.Mesh {
    const geo = new THREE.BoxGeometry(20, this.height, 20);
    const mesh = new THREE.Mesh(geo, this.type === HouseType.Modern ? mat_modern : mat);

    if (this.type !== HouseType.Modern) {
      // Add traditional roof
      const roofGeo = new THREE.ConeGeometry(15, 10, 4);
      const roof = new THREE.Mesh(roofGeo, mat_roof);
      roof.position.set(0, this.height/2 + 3, 0);
      roof.rotation.y = Math.PI / 4;
      mesh.add(roof);
    } else {
      // Add flat modern roof with slight overhang
      const flatRoofGeo = new THREE.BoxGeometry(22, 1, 22);
      const flatRoof = new THREE.Mesh(flatRoofGeo, mat_modern);
      flatRoof.position.set(0, this.height/2 + 0.5, 0);
      mesh.add(flatRoof);
    }

    const { window, window2 } = this.addBasicWindows(mesh);

    // Add door based on house type
    const doorGeo = new THREE.BoxGeometry(6, 8, 6);
    const door = new THREE.Mesh(doorGeo, this.type === HouseType.Modern ? mat_modern_window : mat_door);
    door.position.set(8, -5, 0);
    mesh.add(door);

    // Add door frame
    const doorFrameGeo = new THREE.BoxGeometry(7, 9, 6.5);
    const doorFrame = new THREE.Mesh(doorFrameGeo, mat_frame);
    doorFrame.position.copy(door.position);
    mesh.add(doorFrame);

    if (this.type === HouseType.Medium) {
      const geo2 = new THREE.BoxGeometry(15, this.height - 9, 30);
      const mesh2 = new THREE.Mesh(geo2, mat);
      mesh2.position.set(0, -5, 10);
      mesh.add(mesh2);

      // Add extension roof
      const roofGeo2 = new THREE.ConeGeometry(12, 8, 4);
      const roof2 = new THREE.Mesh(roofGeo2, mat_roof);
      roof2.position.set(0, (this.height - 9)/2 - 1, 10);
      roof2.rotation.y = Math.PI / 4;
      mesh.add(roof2);

      const garageDoorGeo = new THREE.BoxGeometry(6, 8, 8);
      const garageDoor = new THREE.Mesh(garageDoorGeo, mat_door2);
      garageDoor.position.set(5, -7, 18);
      mesh.add(garageDoor);

      const garageDoorFrameGeo = new THREE.BoxGeometry(7, 9, 8.5);
      const garageDoorFrame = new THREE.Mesh(garageDoorFrameGeo, mat_frame);
      garageDoorFrame.position.copy(garageDoor.position);
      mesh.add(garageDoorFrame);
    } else if (this.type === HouseType.Large) {


      // Add garage similar to medium house
      const garageGeo = new THREE.BoxGeometry(15, this.height - 15, 20);
      const garage = new THREE.Mesh(garageGeo, mat);
      garage.position.set(-10, -7.5, 0);
      mesh.add(garage);

      const garageDoorGeo = new THREE.BoxGeometry(8, 10, 8);
      const garageDoor = new THREE.Mesh(garageDoorGeo, mat_door2);
      garageDoor.position.set(-15, -7, 0);
      mesh.add(garageDoor);

      const garageDoorFrameGeo = new THREE.BoxGeometry(9, 11, 8.5);
      const garageDoorFrame = new THREE.Mesh(garageDoorFrameGeo, mat_frame);
      garageDoorFrame.position.copy(garageDoor.position);
      mesh.add(garageDoorFrame);
    } else if (this.type === HouseType.Modern) {
      // Add large panoramic windows
      const panoramicWindowGeo = new THREE.BoxGeometry(12, 8, 0.5);
      const panoramicWindow = new THREE.Mesh(panoramicWindowGeo, mat_modern_window);
      panoramicWindow.position.set(0, 2, 10);
      mesh.add(panoramicWindow);

      const panoramicFrame = new THREE.Mesh(
        new THREE.BoxGeometry(13, 9, 1),
        mat_frame
      );
      panoramicFrame.position.copy(panoramicWindow.position);
      mesh.add(panoramicFrame);

      // Add decorative vertical element
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

    if (gui) {
      GuiHelper.addLocationGui(gui, "window", window);
      GuiHelper.addLocationGui(gui, "window2", window2);
    }

    return mesh;
  }
}

export default House;
