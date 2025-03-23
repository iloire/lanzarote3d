import * as THREE from "three";

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
    console.log(cube);
    scene.add(cube);
  },

  createHelpers: function (scene: THREE.Scene) {
    const grid = this.getGrid({ x: 0, y: 0 });
    scene.add(grid);
    scene.add(this.getAxisHelper(100));
  },

  getAxisHelper: function (len: number) {
    const axesHelperLength = len;
    const axesHelper = new THREE.AxesHelper(axesHelperLength);
    // The X axis is red. The Y axis is green. The Z axis is blue.
    return axesHelper;
  },

  getGrid: (pos: THREE.Vector3) => {
    const grid = new THREE.Object3D();
    const gridH = new THREE.GridHelper(100, 10, 0x0000ff, 0x808080);
    pos.y = 0;
    pos.x = 0;
    gridH.rotation.x = 0;
    grid.add(gridH);

    const gridV = new THREE.GridHelper(100, 10, 0x0000ff, 0x808080);
    pos.y = 0;
    pos.x = 0;
    gridV.rotation.x = -Math.PI / 2;
    grid.add(gridV);
    return grid;
  },

  /**
   * Creates visualization boxes around a mesh for better visibility during development
   * @param scene The scene to add the box helper to
   * @param mesh The mesh to visualize
   * @param color The color of the box
   * @param scale Optional scale factor for the custom box (default 1.2)
   * @returns The BoxHelper object that needs to be updated in the animation loop
   */
  createMeshVisualization: function (
    scene: THREE.Scene,
    mesh: THREE.Object3D,
    color: number = 0xff0000,
    scale: number = 1.2
  ): THREE.BoxHelper {
    // Create a bounding box helper
    const boxHelper = new THREE.BoxHelper(mesh, color);
    scene.add(boxHelper);

    // Create wireframe box with defined size for better visibility
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    const meshSize = new THREE.Vector3();
    boundingBox.getSize(meshSize);

    // Create custom sized wireframe box slightly larger than the actual object
    const boxGeometry = new THREE.BoxGeometry(
      meshSize.x * scale,
      meshSize.y * scale,
      meshSize.z * scale
    );
    const boxMaterial = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.7
    });
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    mesh.add(boxMesh); // Add to the original mesh to follow its transformations

    return boxHelper;
  },
};
export default Helpers;
