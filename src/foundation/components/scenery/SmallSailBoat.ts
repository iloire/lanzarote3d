import * as THREE from 'three';
import GuiHelper from '../../utils/gui';
import { FloatingObject } from './FloatingObject';

const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
const sail_mat = new THREE.MeshLambertMaterial({ color: 0x666666 });

class SmallSailBoat extends FloatingObject {
  load(gui?: any): THREE.Mesh {
    const geo = new THREE.BoxGeometry(10, 2, 4); //w, height, depth
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    const sailGeo = new THREE.ConeGeometry(2, 6, 3);
    const meshSail = new THREE.Mesh(sailGeo, sail_mat);
    meshSail.position.set(0, 4, 0);
    mesh.add(meshSail);

    // Set up floating behavior
    this.setMesh(mesh);
    this.startFloating();

    if (gui) {
      GuiHelper.addLocationGui(gui, 'small-sailboat', mesh);
    }
    return mesh;
  }
}
export default SmallSailBoat;
