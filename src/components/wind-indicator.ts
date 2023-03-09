import * as THREE from "three";

const MAX_HEIGHT = 40;
const X_AXIS_ROTATION_DEGREES = -90;

const getDirectionFromNorth = (
  directionDegreesFromNorth: number
): THREE.Vector3 => {
  const dir = new THREE.Vector3();
  const dirPhi = THREE.MathUtils.degToRad(-directionDegreesFromNorth);
  dir.setFromSphericalCoords(1, Math.PI / 2, dirPhi);
  dir.normalize();
  return dir;
};

const createWindArrow = (
  directionDegreesFromNorth: number,
  length: number,
  origin: THREE.Vector3,
  color
): THREE.ArrowHelper => {
  console.log(origin);
  const arrowHelper = new THREE.ArrowHelper(
    getDirectionFromNorth(directionDegreesFromNorth),
    origin,
    length,
    color || 0xffffff
  );
  return arrowHelper;
};

class WindIndicator {
  length: number;
  constructor(length: number) {
    this.length = length;
  }
  arrow: THREE.ArrowHelper;
  load(directionDegrees: number, origin: THREE.Vector3): THREE.ArrowHelper {
    this.arrow = createWindArrow(
      directionDegrees,
      this.length,
      origin,
      0xffff00
    );
    return this.arrow;
  }

  update(degrees: number) {
    this.arrow.setDirection(getDirectionFromNorth(degrees));
  }
}

export default WindIndicator;
