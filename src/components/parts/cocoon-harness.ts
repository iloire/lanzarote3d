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
    const getSquare = (w, h, z, posX, posY, posZ) => {
      const suitMat = getColoredMaterial(this.options.color1 || '#333');
      const geo = new THREE.BoxGeometry(w, h, z);
      const mesh = new THREE.Mesh(geo, suitMat);
      mesh.position.x = posX;
      mesh.position.y = posY;
      mesh.position.z = posZ;
      return mesh;
    }

    const suitMat = getColoredMaterial(this.options.color1 || '#333');

    const group = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(250, 420, 800);
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

    const cola = getSquare(200, 300, 400, 0, -300, -400);
    group.add(cola)

    const front = getSquare(200, 300, 400, 0, -400, 800);
    group.add(front)

    const reserveHandleMat = getColoredMaterial('red');
    const reserveHandleGeo = new THREE.BoxGeometry(90, 42, 130);
    const reserve = new THREE.Mesh(reserveHandleGeo, reserveHandleMat);
    reserve.position.x = -110;
    reserve.position.y = -295;
    reserve.position.z = 300;
    group.add(reserve);

    return group;
  }

}

export default CocoonHarness;
