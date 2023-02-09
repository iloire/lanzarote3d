import * as THREE from "three";

const Helpers = {
  drawSphericalPosition: (phiDegrees, thetaDegrees, len, scene) => {
    const cubeSize = 190;
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const phi = THREE.MathUtils.degToRad(phiDegrees);
    const theta = THREE.MathUtils.degToRad(thetaDegrees);

    console.log("phi", phi);
    console.log("theta", theta);

    const pos = new THREE.Vector3();
    pos.setFromSphericalCoords(len, theta, phi);
    console.log(pos);

    const cube = new THREE.Mesh(geometry, material);
    cube.position.copy(pos);
    scene.add(cube);
  },

  createHelpers: (scene, options) => {
    const grid = new THREE.Object3D();

    const gridH = new THREE.GridHelper(100, 10, 0x0000ff, 0x808080);
    gridH.position.y = 0;
    gridH.position.x = 0;
    gridH.rotation.x = 0;
    grid.add(gridH);

    const gridV = new THREE.GridHelper(100, 10, 0x0000ff, 0x808080);
    gridV.position.y = 0;
    gridV.position.x = 0;
    gridV.rotation.x = -Math.PI / 2;
    grid.add(gridV);

    scene.add(grid);

    const axesHelperLength = 100;
    const axesHelper = new THREE.AxesHelper(axesHelperLength);
    // The X axis is red. The Y axis is green. The Z axis is blue.
    scene.add(axesHelper);
  },
};
export default Helpers;
