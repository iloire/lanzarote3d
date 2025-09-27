import * as THREE from 'three';
import GuiHelper from '../../utils/gui';
import { FloatingObject } from './FloatingObject';

const hullMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown hull
const cabinMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF }); // White cabin
const mastMat = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Dark brown mast

class FishingBoat extends FloatingObject {
  load(gui?: any): THREE.Group {
    const boat = new THREE.Group();

    // Main hull - longer and wider than sailboat
    const hullGeo = new THREE.BoxGeometry(20, 4, 8);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.castShadow = true;
    boat.add(hull);

    // Cabin structure
    const cabinGeo = new THREE.BoxGeometry(12, 6, 6);
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(-2, 5, 0);
    cabin.castShadow = true;
    boat.add(cabin);

    // Cabin roof
    const roofGeo = new THREE.BoxGeometry(13, 1, 7);
    const roof = new THREE.Mesh(roofGeo, hullMat);
    roof.position.set(-2, 8.5, 0);
    boat.add(roof);

    // Fishing mast/pole
    const mastGeo = new THREE.CylinderGeometry(0.3, 0.3, 12);
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(6, 8, 0);
    boat.add(mast);

    // Cross beam on mast
    const beamGeo = new THREE.CylinderGeometry(0.2, 0.2, 6);
    const beam = new THREE.Mesh(beamGeo, mastMat);
    beam.rotation.z = Math.PI / 2;
    beam.position.set(6, 12, 0);
    boat.add(beam);

    // Wheelhouse windows (simple dark rectangles)
    const windowMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const windowGeo = new THREE.BoxGeometry(8, 3, 0.2);
    const frontWindow = new THREE.Mesh(windowGeo, windowMat);
    frontWindow.position.set(-2, 6, 3.1);
    boat.add(frontWindow);

    const sideWindow = new THREE.Mesh(windowGeo, windowMat);
    sideWindow.rotation.y = Math.PI / 2;
    sideWindow.position.set(4, 6, 0);
    boat.add(sideWindow);

    // Set up floating behavior (automatically starts floating)
    this.setMesh(boat);

    if (gui) {
      GuiHelper.addLocationGui(gui, 'fishing-boat', boat);
    }

    return boat;
  }
}

export default FishingBoat;