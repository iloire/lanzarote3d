import * as THREE from "three";

const MAX_HEIGHT = 40;
const X_AXIS_ROTATION_DEGREES = -90;

const getOriginApplication = (degreesFromNorth) => {
  switch (true) {
    case degreesFromNorth < 30:
      return 175;
    case degreesFromNorth < 45:
      return 145;
    case degreesFromNorth < 65:
      return 145;
    case degreesFromNorth < 90:
      return 105;
    case degreesFromNorth < 135:
      return 45;
    case degreesFromNorth < 180:
      return 30;
    case degreesFromNorth < 225:
      return -30;
    case degreesFromNorth < 270:
      return -65;
    case degreesFromNorth < 315:
      return -90;
    case degreesFromNorth < 330:
      return -145;
    default:
      return -175;
  }
};

const getDirectionFromNorth = (directionDegreesFromNorth) => {
  const dir = new THREE.Vector3();
  const dirPhi = THREE.MathUtils.degToRad(-directionDegreesFromNorth);
  dir.setFromSphericalCoords(1, Math.PI / 2, dirPhi);
  dir.normalize();
  return dir;
};

const createWindArrow = (directionDegreesFromNorth, length, color) => {
  const origin = new THREE.Vector3();
  const originDegreesFromNorth = getOriginApplication(
    directionDegreesFromNorth
  );
  const originPhi = THREE.MathUtils.degToRad(originDegreesFromNorth);
  origin.setFromSphericalCoords(length, Math.PI / 2.1, originPhi);

  const arrowHelper = new THREE.ArrowHelper(
    getDirectionFromNorth(directionDegreesFromNorth),
    origin,
    length,
    color || 0xffffff
  );
  return arrowHelper;
};

class WindIndicator {
  load(directionDegrees, scale, pos) {
    this.arrow = createWindArrow(directionDegrees, 100, 0xffff00);
    return this.arrow;
  }

  update(degrees) {
    this.arrow.setDirection(getDirectionFromNorth(degrees));
  }
}

export default WindIndicator;
