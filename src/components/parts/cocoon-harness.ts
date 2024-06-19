import * as THREE from "three";

const getColoredMaterial = (color: string) => {
  return new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  });
};

export type CocoonHarnessOptions = {
  color1: string;
  color2: string;
}

class CocoonHarness {
  options: CocoonHarnessOptions;

  constructor(options: CocoonHarnessOptions) {
    this.options = options;
  }

  load(): THREE.Object3D {
    const suitMat = getColoredMaterial(this.options.color1 || '#333');

    const group = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(250, 420, 1200);
    const body = new THREE.Mesh(bodyGeo, suitMat);
    body.position.x = 0;
    body.position.y = -390;
    body.position.z = 200;
    group.add(body);

    const subBodyMat = getColoredMaterial(this.options.color1 || '#666');
    const subBodyGeo = new THREE.BoxGeometry(150, 420, 400);
    const subBody = new THREE.Mesh(subBodyGeo, subBodyMat);
    subBody.position.x = 0;
    subBody.position.y = -385;
    subBody.position.z = 400;
    group.add(subBody);

    return group;
  }

}

export default CocoonHarness;
