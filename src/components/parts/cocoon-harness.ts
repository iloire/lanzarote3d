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
  carabinerColor: string;
  carabinerSeparationMM: number;
  width?: number;
  height?: number;
  depth?: number;
}

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 400;
const DEFAULT_DEPTH = 700;


class CocoonHarness {
  options: CocoonHarnessOptions;

  constructor(options: CocoonHarnessOptions) {
    this.options = options;
  }

  load(): THREE.Object3D {
    const getSquare = (w, h, z, posX, posY, posZ, color) => {
      const suitMat = getColoredMaterial(color);
      const geo = new THREE.BoxGeometry(w, h, z);
      const mesh = new THREE.Mesh(geo, suitMat);
      mesh.position.x = posX;
      mesh.position.y = posY;
      mesh.position.z = posZ;
      return mesh;
    }

    const width = this.options.width || DEFAULT_WIDTH;
    const height = this.options.height || DEFAULT_HEIGHT;
    const depth = this.options.depth || DEFAULT_DEPTH;

    const suitMat = getColoredMaterial(this.options.color1 || '#333');

    const group = new THREE.Group();

    const mainGeo = new THREE.BoxGeometry(width, height, depth);
    const body = new THREE.Mesh(mainGeo, suitMat);
    body.position.x = 0;
    body.position.y = -390;
    body.position.z = 100;
    group.add(body);

    const subBodyMat = getColoredMaterial(this.options.color1 || '#666');
    const subBodyGeo = new THREE.BoxGeometry(width * 0.8, height * 0.8, 400);
    const subBody = new THREE.Mesh(subBodyGeo, subBodyMat);
    subBody.position.x = 0;
    subBody.position.y = -395;
    subBody.position.z = height;
    group.add(subBody);

    const cola = getSquare(150, 400, 300, 0, -350, -300, '#333');
    group.add(cola)

    const cola2 = getSquare(100, 300, 400, 0, -320, -430, '#333');
    group.add(cola2)

    const colaAdorno = getSquare(170, 40, 400, 0, -400, -400, '#666');
    group.add(colaAdorno)

    const front = getSquare(200, 300, 400, 0, -400, 800, '#333');
    group.add(front)

    const reserveHandleMat = getColoredMaterial('red');
    const reserveHandleGeo = new THREE.BoxGeometry(90, 42, 130);
    const reserve = new THREE.Mesh(reserveHandleGeo, reserveHandleMat);
    reserve.position.x = -110;
    reserve.position.y = -295;
    reserve.position.z = 300;
    group.add(reserve);

    // carabiner
    const carabinerGeo = new THREE.BoxGeometry(50, 30, 30);
    const carabinerMat = getColoredMaterial(this.options.carabinerColor || '#333');
    const carabinerLeft = new THREE.Mesh(carabinerGeo, carabinerMat);
    carabinerLeft.position.set(this.options.carabinerSeparationMM / 2, -180, 280);

    const carabinerRight = carabinerLeft.clone();
    carabinerRight.position.set(-1 * this.options.carabinerSeparationMM / 2, -180, 280);
    group.add(carabinerLeft);
    group.add(carabinerRight);

    return group;
  }

}

export default CocoonHarness;
