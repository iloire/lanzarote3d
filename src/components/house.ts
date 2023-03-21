import * as THREE from "three";
import GuiHelper from "../utils/gui";

const getColorMaterial = (color: number) => {
  return new THREE.MeshPhongMaterial({ color });
};

const mat = getColorMaterial(0xffffff);
const mat_window = getColorMaterial(0x004d1a);
const mat_door = getColorMaterial(0x004d1a);
const mat_door2 = getColorMaterial(0x4d0000);

export enum HouseType {
  Small,
  Medium,
}

class House {
  height: number = 20;
  type: HouseType;

  constructor(type: HouseType) {
    this.type = type;
  }
  getHeight() {
    return this.height;
  }
  load(gui?: any): THREE.Mesh {
    const geo = new THREE.BoxGeometry(20, this.height, 20);
    const mesh = new THREE.Mesh(geo, mat);

    const windowGeo = new THREE.BoxGeometry(4, 4, 4);
    const window = new THREE.Mesh(windowGeo, mat_window);
    window.position.set(9, 4, 4);

    const window2 = window.clone();
    window2.position.set(9, 4, -4);
    mesh.add(window2);

    const window3 = window.clone();
    window3.position.set(0, 4, 9);
    mesh.add(window3);

    const doorGeo = new THREE.BoxGeometry(6, 8, 6); //widht, height, depth
    const door = new THREE.Mesh(doorGeo, mat_door);
    door.position.set(8, -5, 0);
    mesh.add(door);

    if (this.type === HouseType.Medium) {
      const geo2 = new THREE.BoxGeometry(15, this.height - 9, 30);
      const mesh2 = new THREE.Mesh(geo2, mat);
      mesh2.position.set(0, -5, 10);
      mesh.add(mesh2);

      const garageDoorGeo = new THREE.BoxGeometry(6, 8, 8); //widht, height, depth
      const garageDoor = new THREE.Mesh(garageDoorGeo, mat_door2);
      garageDoor.position.set(5, -7, 18);
      mesh.add(garageDoor);
    }

    if (gui) {
      GuiHelper.addLocationGui(gui, "window", window);
      GuiHelper.addLocationGui(gui, "window2", window2);
    }
    mesh.add(window);

    return mesh;
  }
}

export default House;
