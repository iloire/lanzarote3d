import * as THREE from 'three';
import GuiHelper from '../../utils/gui';
import { FloatingObject } from './FloatingObject';

const hullMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 }); // Orange red hull
const accentMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF }); // White accents
const engineMat = new THREE.MeshLambertMaterial({ color: 0x333333 }); // Dark engine

class SpeedBoat extends FloatingObject {
  load(gui?: any): THREE.Group {
    const speedboat = new THREE.Group();

    // Sleek hull - narrow and tapered
    const hullGeo = new THREE.BoxGeometry(16, 3, 6);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.castShadow = true;
    speedboat.add(hull);

    // Pointed bow
    const bowGeo = new THREE.ConeGeometry(3, 4, 4);
    const bow = new THREE.Mesh(bowGeo, hullMat);
    bow.rotation.z = -Math.PI / 2;
    bow.position.set(10, 0, 0);
    speedboat.add(bow);

    // Small cockpit
    const cockpitGeo = new THREE.BoxGeometry(8, 4, 4);
    const cockpit = new THREE.Mesh(cockpitGeo, accentMat);
    cockpit.position.set(-2, 3, 0);
    speedboat.add(cockpit);

    // Windshield
    const windshieldGeo = new THREE.BoxGeometry(6, 3, 0.2);
    const windshield = new THREE.Mesh(windshieldGeo, accentMat);
    windshield.position.set(1, 4.5, 0);
    windshield.rotation.x = -Math.PI / 8; // Slight angle
    speedboat.add(windshield);

    // Engine compartment
    const engineGeo = new THREE.BoxGeometry(4, 2, 5);
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.set(-6, 2, 0);
    speedboat.add(engine);

    // Outboard motors
    const motorGeo = new THREE.BoxGeometry(1.5, 4, 1.5);
    const leftMotor = new THREE.Mesh(motorGeo, engineMat);
    leftMotor.position.set(-9, 0, -2);
    speedboat.add(leftMotor);

    const rightMotor = new THREE.Mesh(motorGeo, engineMat);
    rightMotor.position.set(-9, 0, 2);
    speedboat.add(rightMotor);

    // Racing stripes
    const stripeGeo = new THREE.BoxGeometry(18, 0.1, 1);
    const leftStripe = new THREE.Mesh(stripeGeo, accentMat);
    leftStripe.position.set(0, 1.6, -2);
    speedboat.add(leftStripe);

    const rightStripe = new THREE.Mesh(stripeGeo, accentMat);
    rightStripe.position.set(0, 1.6, 2);
    speedboat.add(rightStripe);

    // Set up floating behavior
    this.setMesh(speedboat);
    this.startFloating();

    if (gui) {
      GuiHelper.addLocationGui(gui, 'speedboat', speedboat);
    }

    return speedboat;
  }
}

export default SpeedBoat;