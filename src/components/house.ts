import * as THREE from "three";
import GuiHelper from "../utils/gui";

const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
const mat_window = new THREE.MeshLambertMaterial({ color: 0x000000 });
const mat_door = new THREE.MeshLambertMaterial({ color: 0xff0000 });

class House {
  height: number = 20;
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

    const doorGeo = new THREE.BoxGeometry(6, 8, 6); //widht, height, depth
    const door = new THREE.Mesh(doorGeo, mat_window);
    door.position.set(8, -5, 0);
    mesh.add(door);

    if (gui) {
      GuiHelper.addLocationGui(gui, "window", window);
      GuiHelper.addLocationGui(gui, "window2", window2);
    }
    mesh.add(window);

    return mesh;
  }
}

export default House;
