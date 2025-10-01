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
const DEFAULT_HEIGHT = 500;
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

    // Y-axis positioning (height/vertical) - Using absolute offsets for consistent spacing
    const baseY = -400; // Base reference position (lowered to make head visible)
    const HEIGHT_POSITIONS = {
      topFin: baseY + 160,        // Top periscope
      carabiners: baseY + 120,    // Attachment points
      topPanel: baseY + 40,       // Upper hull panel
      upperDome: baseY + 20,      // Upper cockpit dome
      frontWindow: baseY + 4,     // Front viewport
      sideWindows: baseY - 40,    // Side viewports
      hatch: baseY - 40,          // Emergency hatch
      mainHull: baseY,            // Main hull center (reference)
      bottomPanel: baseY - 64,    // Lower hull panel
      fins: baseY,                // Side stabilizer fins
      thruster: baseY,            // Back thruster
    };

    // Z-axis positioning (depth/forward-back) - Using cumulative positioning
    // Elements are positioned relative to each other to maintain proper spacing
    // regardless of depth parameter changes
    const DEPTH_POSITIONS = {
      // Back to front positioning - cumulative offsets from center
      thruster: -depth / 2,                    // Back edge (thruster at rear)
      rearFins: -depth / 2 + depth * 0.15,     // Stabilizer fins (slightly forward of thruster)
      lowerHull: -depth / 2 + depth * 0.75,    // Lower hull (overlaps with main hull)
      center: 0,                               // Main hull center (reference point)
      upperDome: 75,                           // Upper dome (absolute offset from center)
      sideWindows: 75,                         // Side windows (aligned with dome)
      hatch: 150,                              // Emergency hatch (absolute offset)
      carabiners: 270,                         // Attachment points (absolute offset)
      frontWindow: depth / 2,                  // Front viewport (at front edge)
      topFin: 0,                               // Top periscope (at center)
    };

    // Main hull - larger rounded body
    const mainHullGeo = new THREE.BoxGeometry(width, height, depth);
    const mainHull = new THREE.Mesh(mainHullGeo, hullMat);
    mainHull.position.set(0, HEIGHT_POSITIONS.mainHull, DEPTH_POSITIONS.center + 50);
    group.add(mainHull);

    // Lower hull section - tapered
    const lowerHullGeo = new THREE.BoxGeometry(width * 0.85, height * 0.7, depth * 1.7);
    const lowerHull = new THREE.Mesh(lowerHullGeo, hullMat);
    lowerHull.position.set(0, HEIGHT_POSITIONS.mainHull, DEPTH_POSITIONS.lowerHull - 100);
    group.add(lowerHull);

    // Upper dome/cockpit
    const upperDomeGeo = new THREE.BoxGeometry(width * 0.9, height * 0.6, depth * 0.5);
    const upperDome = new THREE.Mesh(upperDomeGeo, hullMat);
    upperDome.position.set(0, HEIGHT_POSITIONS.upperDome, DEPTH_POSITIONS.upperDome);
    group.add(upperDome);

    // Front window/viewport - large transparent section
    const frontWindowGeo = new THREE.BoxGeometry(width * 0.7, height * 0.5, depth * 0.0625);
    const frontWindow = new THREE.Mesh(frontWindowGeo, windowMat);
    frontWindow.position.set(0, HEIGHT_POSITIONS.frontWindow, DEPTH_POSITIONS.frontWindow);
    group.add(frontWindow);

    // Side windows
    const sideWindowGeo = new THREE.BoxGeometry(width * 0.13, height * 0.4, depth * 0.6);
    const leftWindow = new THREE.Mesh(sideWindowGeo, windowMat);
    leftWindow.position.set(-width / 2, HEIGHT_POSITIONS.sideWindows, DEPTH_POSITIONS.sideWindows);
    group.add(leftWindow);

    const rightWindow = leftWindow.clone();
    rightWindow.position.set(width / 2, HEIGHT_POSITIONS.sideWindows, DEPTH_POSITIONS.sideWindows);
    group.add(rightWindow);

    // Hull details/panels
    const panelMat = getColoredMaterial('#0d2433');
    const panelGeo = new THREE.BoxGeometry(width * 0.9, height * 0.24, depth * 0.95);
    const topPanel = new THREE.Mesh(panelGeo, panelMat);
    topPanel.position.set(0, HEIGHT_POSITIONS.topPanel, DEPTH_POSITIONS.center);
    group.add(topPanel);

    const bottomPanel = topPanel.clone();
    bottomPanel.position.set(0, HEIGHT_POSITIONS.bottomPanel, DEPTH_POSITIONS.center);
    group.add(bottomPanel);

    // Stabilizer fins
    const finGeo = new THREE.BoxGeometry(width * 0.18, height * 0.72, depth * 0.0375);
    const finMat = getColoredMaterial('#0d2433');
    const leftFin = new THREE.Mesh(finGeo, finMat);
    leftFin.position.set(-width / 2 - width * 0.044, HEIGHT_POSITIONS.fins, DEPTH_POSITIONS.rearFins);
    leftFin.rotation.z = Math.PI / 6;
    group.add(leftFin);

    const rightFin = leftFin.clone();
    rightFin.position.set(width / 2 + width * 0.044, HEIGHT_POSITIONS.fins, DEPTH_POSITIONS.rearFins);
    rightFin.rotation.z = -Math.PI / 6;
    group.add(rightFin);

    // Top fin/periscope
    const topFinGeo = new THREE.BoxGeometry(width * 0.33, height * 0.32, depth * 0.05);
    const topFin = new THREE.Mesh(topFinGeo, finMat);
    topFin.position.set(0, HEIGHT_POSITIONS.topFin, DEPTH_POSITIONS.topFin);
    group.add(topFin);

    // Carabiners - attachment points on top
    const carabinerGeo = new THREE.BoxGeometry(width * 0.13, height * 0.16, depth * 0.05);
    const carabinerLeft = new THREE.Mesh(carabinerGeo, carabinerMat);
    carabinerLeft.position.set(this.options.carabinerSeparationMM / 2, HEIGHT_POSITIONS.carabiners, DEPTH_POSITIONS.carabiners);
    group.add(carabinerLeft);

    const carabinerRight = carabinerLeft.clone();
    carabinerRight.position.set((-1 * this.options.carabinerSeparationMM) / 2, HEIGHT_POSITIONS.carabiners, DEPTH_POSITIONS.carabiners);
    group.add(carabinerRight);

    // Emergency hatch indicator (red)
    const hatchMat = getColoredMaterial('red');
    const hatchGeo = new THREE.BoxGeometry(width * 0.22, height * 0.32, depth * 0.075);
    const hatch = new THREE.Mesh(hatchGeo, hatchMat);
    hatch.position.set(-width / 2 + width * 0.067, HEIGHT_POSITIONS.hatch, DEPTH_POSITIONS.hatch);
    group.add(hatch);

    // Propulsion/thruster details
    const thrusterGeo = new THREE.BoxGeometry(width * 0.2, height * 0.36, depth * 0.15);
    const thrusterMat = getColoredMaterial('#2a4a62');
    const backThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    backThruster.position.set(0, HEIGHT_POSITIONS.thruster, DEPTH_POSITIONS.thruster);
    group.add(backThruster);

    return group;
  }
}

export default SubmarineHarness;
