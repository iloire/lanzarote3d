import * as THREE from "three";
import GuiHelper from "../utils/gui";

const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
const sail_mat = new THREE.MeshLambertMaterial({ color: 0x666666 });

class Boat {
  load(gui?: any): THREE.Mesh {
    const geo = new THREE.BoxGeometry(10, 2, 4); //w, height, depth
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    const sailGeo = new THREE.ConeGeometry(2, 6, 3);
    const meshSail = new THREE.Mesh(sailGeo, sail_mat);
    meshSail.position.set(0, 4, 0);
    mesh.add(meshSail);

    if (gui) {
      GuiHelper.addLocationGui(gui, "boat", mesh);
    }
    return mesh;
  }
}
export default Boat;
