import * as THREE from 'three';
import GuiHelper from '../../utils/gui';

const hullMat = new THREE.MeshLambertMaterial({ color: 0xF5F5F5 }); // Off-white hull
const trimMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 }); // Royal blue trim
const glassMat = new THREE.MeshLambertMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.7 }); // Sky blue glass

class Yacht {
  load(gui?: any): THREE.Group {
    const yacht = new THREE.Group();

    // Main hull - sleek and long
    const hullGeo = new THREE.BoxGeometry(30, 5, 10);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.castShadow = true;
    yacht.add(hull);

    // Lower deck
    const lowerDeckGeo = new THREE.BoxGeometry(25, 2, 8);
    const lowerDeck = new THREE.Mesh(lowerDeckGeo, hullMat);
    lowerDeck.position.set(0, 3.5, 0);
    yacht.add(lowerDeck);

    // Upper cabin/bridge
    const cabinGeo = new THREE.BoxGeometry(15, 8, 7);
    const cabin = new THREE.Mesh(cabinGeo, hullMat);
    cabin.position.set(-3, 8, 0);
    cabin.castShadow = true;
    yacht.add(cabin);

    // Bridge/flybridge
    const bridgeGeo = new THREE.BoxGeometry(8, 4, 5);
    const bridge = new THREE.Mesh(bridgeGeo, hullMat);
    bridge.position.set(-3, 14, 0);
    yacht.add(bridge);

    // Trim lines
    const trimGeo = new THREE.BoxGeometry(32, 0.5, 10.5);
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, 2.5, 0);
    yacht.add(trim);

    // Large windows on main cabin
    const windowGeo = new THREE.BoxGeometry(12, 5, 0.3);
    const frontWindow = new THREE.Mesh(windowGeo, glassMat);
    frontWindow.position.set(-3, 9, 3.6);
    yacht.add(frontWindow);

    const backWindow = new THREE.Mesh(windowGeo, glassMat);
    backWindow.position.set(-3, 9, -3.6);
    yacht.add(backWindow);

    // Side windows
    const sideWindowGeo = new THREE.BoxGeometry(0.3, 5, 6);
    const leftWindow = new THREE.Mesh(sideWindowGeo, glassMat);
    leftWindow.position.set(4.6, 9, 0);
    yacht.add(leftWindow);

    const rightWindow = new THREE.Mesh(sideWindowGeo, glassMat);
    rightWindow.position.set(-10.6, 9, 0);
    yacht.add(rightWindow);

    // Radar/antenna mast
    const mastGeo = new THREE.CylinderGeometry(0.2, 0.2, 8);
    const mast = new THREE.Mesh(mastGeo, trimMat);
    mast.position.set(-3, 20, 0);
    yacht.add(mast);

    // Radar dish
    const radarGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.3);
    const radar = new THREE.Mesh(radarGeo, glassMat);
    radar.position.set(-3, 24, 0);
    yacht.add(radar);

    if (gui) {
      GuiHelper.addLocationGui(gui, 'yacht', yacht);
    }

    return yacht;
  }
}

export default Yacht;