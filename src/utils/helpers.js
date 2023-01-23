import * as THREE from "three";

const Helpers = {
  createHelpers: (scene) => {
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

    const dir = new THREE.Vector3(10, 0, -2);
    //normalize the direction vector (convert to vector of length 1)
    dir.normalize();

    const origin = new THREE.Vector3(-100, 10, 0);
    const length = 100;
    const hex = 0xffff00;

    const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
    scene.add(arrowHelper);
  },
};
export default Helpers;
