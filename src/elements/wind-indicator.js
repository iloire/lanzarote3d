import * as THREE from "three";

const MAX_HEIGHT = 40;
const X_AXIS_ROTATION_DEGREES = -90;

const getOriginApplication = (degreesFromNorth) => {
  console.log("degreesFromNorth", degreesFromNorth);
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

const createWindArrow = (directionDegreesFromNorth, length, color) => {
  const dir = new THREE.Vector3();
  const dirPhi = THREE.MathUtils.degToRad(-directionDegreesFromNorth);
  dir.setFromSphericalCoords(1, Math.PI / 2, dirPhi);
  dir.normalize();

  const origin = new THREE.Vector3();
  const originDegreesFromNorth = getOriginApplication(
    directionDegreesFromNorth
  );
  const originPhi = THREE.MathUtils.degToRad(originDegreesFromNorth);
  origin.setFromSphericalCoords(length, Math.PI / 2.1, originPhi);

  const arrowHelper = new THREE.ArrowHelper(
    dir,
    origin,
    length,
    color || 0xffffff
  );
  return arrowHelper;
};

const createArrow = (directionDegreesFromNorth, origin, length, color) => {
  const dir = new THREE.Vector3();
  const dirPhi = THREE.MathUtils.degToRad(-directionDegreesFromNorth);
  dir.setFromSphericalCoords(1, Math.PI / 2, dirPhi);
  dir.normalize();

  const arrowHelper = new THREE.ArrowHelper(
    dir,
    origin || new THREE.Vector3(0, 0, 0),
    length || 30,
    color || 0xffffff
  );
  return arrowHelper;
};

const createCompassRose = (scale, pos) => {
  const extrudeSettings = {
    depth: 0.2,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 16,
  };

  const arcShape = new THREE.Shape();
  arcShape.absarc(0, 0, 1, 0, Math.PI * 2, 0, false);

  const holePath = new THREE.Path();
  holePath.absarc(0, 0, 0.8, 0, Math.PI * 2, true);
  arcShape.holes.push(holePath);

  const geometry = new THREE.ExtrudeGeometry(arcShape, extrudeSettings);

  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(scale, scale, scale);
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.rotation.x = -Math.PI / 2;

  return mesh;
};

const createWindDirection = (directionDegreesFromNorth, scale, pos) => {
  var extrudeSettings = {
    bevelEnabled: false,
    steps: 1,
    depth: 0.3,
  };

  var shape = new THREE.Shape();
  var circleRadius = 1.1;

  // shape.moveTo(0, -circleRadius);

  shape.absarc(0, 0, circleRadius, 0, Math.PI / 2, false);
  shape.lineTo(0, 0);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.scale.set(scale, scale, scale);
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.rotation.x = -Math.PI / 2;

  const rotation = THREE.MathUtils.degToRad(directionDegreesFromNorth);
  mesh.rotation.z = -rotation;
  return mesh;
};

const WindIndicator = {
  load: (directionDegrees, scale, pos) => {
    const circle = createCompassRose(scale, pos);
    const windDir = createWindDirection(directionDegrees, scale, pos);
    const northArrow = createArrow(
      0,
      new THREE.Vector3(0, 30, -50),
      60,
      0x000000
    );
    const windArrow = createWindArrow(directionDegrees, 100, 0xffff00);
    const group = new THREE.Group();
    group.add(windArrow, circle, windDir, northArrow);
    return group;
  },
};

export default WindIndicator;
