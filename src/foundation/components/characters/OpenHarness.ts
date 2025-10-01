import * as THREE from 'three';

const getColoredMaterial = (color: string) => {
  return new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
  });
};

export type OpenHarnessOptions = {
  strapColor: string;
  carabinerColor: string;
  carabinerSeparationMM: number;
};

/**
 * OpenHarness - Minimal harness with just straps and carabiners
 * Looks like the pilot is not wearing a bulky harness, more like climbing gear
 */
class OpenHarness {
  options: OpenHarnessOptions;

  constructor(options: OpenHarnessOptions) {
    this.options = options;
  }

  load(): THREE.Object3D {
    const group = new THREE.Group();

    const strapMat = getColoredMaterial(this.options.strapColor || '#222');
    const carabinerMat = getColoredMaterial(this.options.carabinerColor || '#666');

    // Shoulder straps - thin vertical straps
    const shoulderStrapGeo = new THREE.BoxGeometry(40, 300, 20);
    const leftShoulderStrap = new THREE.Mesh(shoulderStrapGeo, strapMat);
    leftShoulderStrap.position.set(-90, -250, 150);
    group.add(leftShoulderStrap);

    const rightShoulderStrap = leftShoulderStrap.clone();
    rightShoulderStrap.position.set(90, -250, 150);
    group.add(rightShoulderStrap);

    // Chest strap - horizontal connection
    const chestStrapGeo = new THREE.BoxGeometry(220, 30, 20);
    const chestStrap = new THREE.Mesh(chestStrapGeo, strapMat);
    chestStrap.position.set(0, -150, 150);
    group.add(chestStrap);

    // Leg straps
    const legStrapGeo = new THREE.BoxGeometry(35, 250, 18);
    const leftLegStrap = new THREE.Mesh(legStrapGeo, strapMat);
    leftLegStrap.position.set(-80, -500, 120);
    group.add(leftLegStrap);

    const rightLegStrap = leftLegStrap.clone();
    rightLegStrap.position.set(80, -500, 120);
    group.add(rightLegStrap);

    // Seat board - small flat support
    const seatGeo = new THREE.BoxGeometry(200, 15, 180);
    const seat = new THREE.Mesh(seatGeo, strapMat);
    seat.position.set(0, -390, 100);
    group.add(seat);

    // Back support strap
    const backStrapGeo = new THREE.BoxGeometry(180, 250, 25);
    const backStrap = new THREE.Mesh(backStrapGeo, strapMat);
    backStrap.position.set(0, -300, -30);
    group.add(backStrap);

    // Carabiners at attachment points
    const carabinerGeo = new THREE.BoxGeometry(50, 30, 30);
    const carabinerLeft = new THREE.Mesh(carabinerGeo, carabinerMat);
    carabinerLeft.position.set(this.options.carabinerSeparationMM / 2, -180, 280);
    group.add(carabinerLeft);

    const carabinerRight = carabinerLeft.clone();
    carabinerRight.position.set((-1 * this.options.carabinerSeparationMM) / 2, -180, 280);
    group.add(carabinerRight);

    // Reserve parachute handle (small, minimal)
    const reserveHandleMat = getColoredMaterial('red');
    const reserveHandleGeo = new THREE.BoxGeometry(50, 30, 80);
    const reserve = new THREE.Mesh(reserveHandleGeo, reserveHandleMat);
    reserve.position.set(-120, -380, 140);
    group.add(reserve);

    return group;
  }
}

export default OpenHarness;
