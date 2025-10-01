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
const DEFAULT_HEIGHT = 200;
const DEFAULT_DEPTH = 1200;

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

    // All Y positions and sizes are now relative to height for proper scaling
    const centerY = -height * 2.0; // Main center position - lowered to make head more visible

    // Main hull - larger rounded body
    const mainHullGeo = new THREE.BoxGeometry(width, height, depth);
    const mainHull = new THREE.Mesh(mainHullGeo, hullMat);
    mainHull.position.set(0, centerY, depth * 0.125);
    group.add(mainHull);

    // Lower hull section - tapered
    const lowerHullGeo = new THREE.BoxGeometry(width * 0.85, height * 0.7, depth * 0.7);
    const lowerHull = new THREE.Mesh(lowerHullGeo, hullMat);
    lowerHull.position.set(0, centerY, -depth * 0.3125);
    group.add(lowerHull);

    // Upper dome/cockpit
    const upperDomeGeo = new THREE.BoxGeometry(width * 0.9, height * 0.6, depth * 0.5);
    const upperDome = new THREE.Mesh(upperDomeGeo, hullMat);
    upperDome.position.set(0, -height * 0.4, depth * 0.1875);
    group.add(upperDome);

    // Front window/viewport - large transparent section
    const frontWindowGeo = new THREE.BoxGeometry(width * 0.7, height * 0.5, depth * 0.0625);
    const frontWindow = new THREE.Mesh(frontWindowGeo, windowMat);
    frontWindow.position.set(0, -height * 0.48, depth * 0.5625);
    group.add(frontWindow);

    // Side windows
    const sideWindowGeo = new THREE.BoxGeometry(width * 0.13, height * 0.4, depth * 0.6);
    const leftWindow = new THREE.Mesh(sideWindowGeo, windowMat);
    leftWindow.position.set(-width / 2, -height * 1.2, depth * 0.1875);
    group.add(leftWindow);

    const rightWindow = leftWindow.clone();
    rightWindow.position.set(width / 2, -height * 1.2, depth * 0.1875);
    group.add(rightWindow);

    // Hull details/panels
    const panelMat = getColoredMaterial('#0d2433');
    const panelGeo = new THREE.BoxGeometry(width * 0.9, height * 0.24, depth * 0.95);
    const topPanel = new THREE.Mesh(panelGeo, panelMat);
    topPanel.position.set(0, -height * 0.8, depth * 0.125);
    group.add(topPanel);

    const bottomPanel = topPanel.clone();
    bottomPanel.position.set(0, -height * 2.32, depth * 0.125);
    group.add(bottomPanel);

    // Stabilizer fins
    const finGeo = new THREE.BoxGeometry(width * 0.18, height * 0.72, depth * 0.0375);
    const finMat = getColoredMaterial('#0d2433');
    const leftFin = new THREE.Mesh(finGeo, finMat);
    leftFin.position.set(-width / 2 - width * 0.044, centerY, -depth * 0.25);
    leftFin.rotation.z = Math.PI / 6;
    group.add(leftFin);

    const rightFin = leftFin.clone();
    rightFin.position.set(width / 2 + width * 0.044, centerY, -depth * 0.25);
    rightFin.rotation.z = -Math.PI / 6;
    group.add(rightFin);

    // Top fin/periscope
    const topFinGeo = new THREE.BoxGeometry(width * 0.33, height * 0.32, depth * 0.05);
    const topFin = new THREE.Mesh(topFinGeo, finMat);
    topFin.position.set(0, -height * 0.2, 0);
    group.add(topFin);

    // Carabiners - attachment points on top
    const carabinerGeo = new THREE.BoxGeometry(width * 0.13, height * 0.16, depth * 0.05);
    const carabinerLeft = new THREE.Mesh(carabinerGeo, carabinerMat);
    carabinerLeft.position.set(this.options.carabinerSeparationMM / 2, -height * 0.4, depth * 0.35);
    group.add(carabinerLeft);

    const carabinerRight = carabinerLeft.clone();
    carabinerRight.position.set((-1 * this.options.carabinerSeparationMM) / 2, -height * 0.4, depth * 0.35);
    group.add(carabinerRight);

    // Emergency hatch indicator (red)
    const hatchMat = getColoredMaterial('red');
    const hatchGeo = new THREE.BoxGeometry(width * 0.22, height * 0.32, depth * 0.075);
    const hatch = new THREE.Mesh(hatchGeo, hatchMat);
    hatch.position.set(-width / 2 + width * 0.067, -height * 1.2, depth * 0.25);
    group.add(hatch);

    // Propulsion/thruster details
    const thrusterGeo = new THREE.BoxGeometry(width * 0.2, height * 0.36, depth * 0.15);
    const thrusterMat = getColoredMaterial('#2a4a62');
    const backThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    backThruster.position.set(0, centerY, -depth / 2 - depth * 0.0625);
    group.add(backThruster);

    return group;
  }
}

export default SubmarineHarness;
