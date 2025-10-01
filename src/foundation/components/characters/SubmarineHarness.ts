import * as THREE from 'three';

const getColoredMaterial = (color: string, transparent: boolean = false, opacity: number = 1.0) => {
  return new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
    transparent,
    opacity,
  });
};

export type SubmarineHarnessOptions = {
  hullColor: string;
  windowColor: string;
  carabinerColor: string;
  carabinerSeparationMM: number;
  width?: number;
  height?: number;
  depth?: number;
};

const DEFAULT_WIDTH = 450;
const DEFAULT_HEIGHT = 450;
const DEFAULT_DEPTH = 800;

/**
 * SubmarineHarness - Enclosed pod-like harness
 * Looks like the paragliding pilot is inside a submarine or spaceship
 */
class SubmarineHarness {
  options: SubmarineHarnessOptions;

  constructor(options: SubmarineHarnessOptions) {
    this.options = options;
  }

  load(): THREE.Object3D {
    const width = this.options.width || DEFAULT_WIDTH;
    const height = this.options.height || DEFAULT_HEIGHT;
    const depth = this.options.depth || DEFAULT_DEPTH;

    const hullMat = getColoredMaterial(this.options.hullColor || '#1a3a52');
    const windowMat = getColoredMaterial(this.options.windowColor || '#88ccff', true, 0.4);
    const carabinerMat = getColoredMaterial(this.options.carabinerColor || '#666');

    const group = new THREE.Group();

    // Main hull - larger rounded body
    const mainHullGeo = new THREE.BoxGeometry(width, height, depth);
    const mainHull = new THREE.Mesh(mainHullGeo, hullMat);
    mainHull.position.set(0, -390, 100);
    group.add(mainHull);

    // Lower hull section - tapered
    const lowerHullGeo = new THREE.BoxGeometry(width * 0.85, height * 0.7, depth * 0.7);
    const lowerHull = new THREE.Mesh(lowerHullGeo, hullMat);
    lowerHull.position.set(0, -390, -250);
    group.add(lowerHull);

    // Upper dome/cockpit
    const upperDomeGeo = new THREE.BoxGeometry(width * 0.9, height * 0.6, depth * 0.5);
    const upperDome = new THREE.Mesh(upperDomeGeo, hullMat);
    upperDome.position.set(0, -100, 150);
    group.add(upperDome);

    // Front window/viewport - large transparent section
    const frontWindowGeo = new THREE.BoxGeometry(width * 0.7, height * 0.5, 50);
    const frontWindow = new THREE.Mesh(frontWindowGeo, windowMat);
    frontWindow.position.set(0, -120, 450);
    group.add(frontWindow);

    // Side windows
    const sideWindowGeo = new THREE.BoxGeometry(60, height * 0.4, depth * 0.6);
    const leftWindow = new THREE.Mesh(sideWindowGeo, windowMat);
    leftWindow.position.set(-width / 2, -300, 150);
    group.add(leftWindow);

    const rightWindow = leftWindow.clone();
    rightWindow.position.set(width / 2, -300, 150);
    group.add(rightWindow);

    // Hull details/panels
    const panelMat = getColoredMaterial('#0d2433');
    const panelGeo = new THREE.BoxGeometry(width * 0.9, 60, depth * 0.95);
    const topPanel = new THREE.Mesh(panelGeo, panelMat);
    topPanel.position.set(0, -200, 100);
    group.add(topPanel);

    const bottomPanel = topPanel.clone();
    bottomPanel.position.set(0, -580, 100);
    group.add(bottomPanel);

    // Stabilizer fins
    const finGeo = new THREE.BoxGeometry(80, 180, 30);
    const finMat = getColoredMaterial('#0d2433');
    const leftFin = new THREE.Mesh(finGeo, finMat);
    leftFin.position.set(-width / 2 - 20, -390, -200);
    leftFin.rotation.z = Math.PI / 6;
    group.add(leftFin);

    const rightFin = leftFin.clone();
    rightFin.position.set(width / 2 + 20, -390, -200);
    rightFin.rotation.z = -Math.PI / 6;
    group.add(rightFin);

    // Top fin/periscope
    const topFinGeo = new THREE.BoxGeometry(150, 80, 40);
    const topFin = new THREE.Mesh(topFinGeo, finMat);
    topFin.position.set(0, -50, 0);
    group.add(topFin);

    // Carabiners - attachment points on top
    const carabinerGeo = new THREE.BoxGeometry(60, 40, 40);
    const carabinerLeft = new THREE.Mesh(carabinerGeo, carabinerMat);
    carabinerLeft.position.set(this.options.carabinerSeparationMM / 2, -100, 280);
    group.add(carabinerLeft);

    const carabinerRight = carabinerLeft.clone();
    carabinerRight.position.set((-1 * this.options.carabinerSeparationMM) / 2, -100, 280);
    group.add(carabinerRight);

    // Emergency hatch indicator (red)
    const hatchMat = getColoredMaterial('red');
    const hatchGeo = new THREE.BoxGeometry(100, 80, 60);
    const hatch = new THREE.Mesh(hatchGeo, hatchMat);
    hatch.position.set(-width / 2 + 30, -300, 200);
    group.add(hatch);

    // Propulsion/thruster details
    const thrusterGeo = new THREE.BoxGeometry(90, 90, 120);
    const thrusterMat = getColoredMaterial('#2a4a62');
    const backThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    backThruster.position.set(0, -390, -depth / 2 - 50);
    group.add(backThruster);

    return group;
  }
}

export default SubmarineHarness;
