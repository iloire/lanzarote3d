import * as THREE from 'three';
import { logger } from './logger';

const Helpers = {
  drawSphericalPosition: (
    phiDegrees: number,
    thetaDegrees: number,
    len: number,
    scene: THREE.Scene
  ) => {
    const phi = THREE.MathUtils.degToRad(phiDegrees);
    const theta = THREE.MathUtils.degToRad(thetaDegrees);

    const pos = new THREE.Vector3();
    pos.setFromSphericalCoords(len, phi, theta);

    Helpers.drawPoint(scene, pos);
  },

  drawPoint(scene: THREE.Scene, position: THREE.Vector3) {
    const cubeSize = 1900;
    const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const cube = new THREE.Mesh(geometry, material);
    cube.position.copy(position);
    logger.debug('Added debug cube at position:', position);
    scene.add(cube);
  },

  createHelpers: function (scene: THREE.Scene, scale: number = 100) {
    const grid = this.getGrid(new THREE.Vector3(0, 0, 0), scale);
    scene.add(grid);
    scene.add(this.getAxisHelperWithLabels(scale));
  },

  createSelectiveHelpers: function (scene: THREE.Scene, config: { axes?: boolean; grid?: boolean; lighting?: boolean; scale?: number }, scale: number = 100) {
    // Use the scale from config if provided, otherwise use the passed scale parameter
    const actualScale = config.scale || scale;

    if (config.grid !== false) {
      const grid = this.getGrid(new THREE.Vector3(0, 0, 0), actualScale);
      scene.add(grid);
    }

    if (config.axes !== false) {
      scene.add(this.getAxisHelperWithLabels(actualScale));
    }

    // Lighting helpers can be added here in the future
    if (config.lighting) {
      // TODO: Add lighting helpers (sun position indicator, etc)
      console.log('Lighting helpers not yet implemented');
    }
  },

  getAxisHelper: function (len: number) {
    const axesHelperLength = len;
    const axesHelper = new THREE.AxesHelper(axesHelperLength);
    // The X axis is red. The Y axis is green. The Z axis is blue.
    return axesHelper;
  },

  getAxisHelperWithLabels: function (len: number) {
    const group = new THREE.Group();

    // Add the standard axes helper
    const axesHelper = new THREE.AxesHelper(len);
    group.add(axesHelper);

    // Create directional indicators for each axis
    // Make labels larger for better visibility at distance
    const labelSize = len * 0.08;

    // Helper function to create text geometry
    const createTextLabel = (text: string, color: number, position: THREE.Vector3) => {
      // Create text geometry
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return null;

      // Set canvas size and font
      canvas.width = 256;
      canvas.height = 256;
      context.font = 'Bold 120px Arial';
      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      // Fill text
      context.fillText(text, canvas.width / 2, canvas.height / 2);

      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      // Create sprite material and sprite
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(labelSize * 4, labelSize * 4, 1);
      sprite.position.copy(position);

      return sprite;
    };

    // X-axis label (red) - positive X direction
    const xGeometry = new THREE.SphereGeometry(labelSize, 8, 6);
    const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const xLabel = new THREE.Mesh(xGeometry, xMaterial);
    xLabel.position.set(len + labelSize * 2, 0, 0);
    xLabel.name = 'X-axis-label';
    group.add(xLabel);

    // Add text label for X axis
    const xTextLabel = createTextLabel('X', 0xff0000, new THREE.Vector3(len + labelSize * 5, 0, 0));
    if (xTextLabel) {
      xTextLabel.name = 'X-axis-text';
      group.add(xTextLabel);
    }

    // Y-axis label (green) - positive Y direction
    const yGeometry = new THREE.SphereGeometry(labelSize, 8, 6);
    const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yLabel = new THREE.Mesh(yGeometry, yMaterial);
    yLabel.position.set(0, len + labelSize * 2, 0);
    yLabel.name = 'Y-axis-label';
    group.add(yLabel);

    // Add text label for Y axis
    const yTextLabel = createTextLabel('Y', 0x00ff00, new THREE.Vector3(0, len + labelSize * 5, 0));
    if (yTextLabel) {
      yTextLabel.name = 'Y-axis-text';
      group.add(yTextLabel);
    }

    // Z-axis label (blue) - positive Z direction
    const zGeometry = new THREE.SphereGeometry(labelSize, 8, 6);
    const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zLabel = new THREE.Mesh(zGeometry, zMaterial);
    zLabel.position.set(0, 0, len + labelSize * 2);
    zLabel.name = 'Z-axis-label';
    group.add(zLabel);

    // Add text label for Z axis
    const zTextLabel = createTextLabel('Z', 0x0000ff, new THREE.Vector3(0, 0, len + labelSize * 5));
    if (zTextLabel) {
      zTextLabel.name = 'Z-axis-text';
      group.add(zTextLabel);
    }

    // Add prominent arrow indicator for negative Z (forward direction)
    // Since our convention is -Z = forward, add a clear directional arrow
    const arrowGroup = new THREE.Group();

    // Create arrow shaft (cylinder)
    const shaftGeometry = new THREE.CylinderGeometry(labelSize * 0.3, labelSize * 0.3, labelSize * 3, 8);
    const shaftMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const shaftMesh = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaftMesh.position.set(0, 0, -len - labelSize * 1.5);
    shaftMesh.rotation.x = Math.PI / 2; // Rotate to align with Z axis
    arrowGroup.add(shaftMesh);

    // Create arrow head (cone)
    const arrowHeadGeometry = new THREE.ConeGeometry(labelSize * 0.8, labelSize * 1.5, 8);
    const arrowHeadMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const arrowHeadMesh = new THREE.Mesh(arrowHeadGeometry, arrowHeadMaterial);
    arrowHeadMesh.position.set(0, 0, -len - labelSize * 3.5);
    arrowHeadMesh.rotation.x = -Math.PI / 2; // Point towards negative Z (forward)
    arrowGroup.add(arrowHeadMesh);

    arrowGroup.name = 'Forward-direction-arrow';
    group.add(arrowGroup);

    // Add text label for forward direction
    const forwardTextLabel = createTextLabel('FWD', 0x00ffff, new THREE.Vector3(0, labelSize * 2, -len - labelSize * 3));
    if (forwardTextLabel) {
      forwardTextLabel.name = 'Forward-direction-text';
      group.add(forwardTextLabel);
    }

    group.name = 'AxisHelperWithLabels';
    return group;
  },

  getGrid: (pos: THREE.Vector3, scale: number = 100) => {
    const grid = new THREE.Object3D();
    const gridSize = scale;
    const divisions = 10;

    const gridH = new THREE.GridHelper(gridSize, divisions, 0x0000ff, 0x808080);
    pos.y = 0;
    pos.x = 0;
    gridH.rotation.x = 0;
    grid.add(gridH);

    const gridV = new THREE.GridHelper(gridSize, divisions, 0x0000ff, 0x808080);
    pos.y = 0;
    pos.x = 0;
    gridV.rotation.x = -Math.PI / 2;
    grid.add(gridV);
    return grid;
  },
};
export default Helpers;
