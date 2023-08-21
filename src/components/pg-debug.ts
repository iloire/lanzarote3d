import * as THREE from "three";
import Paraglider from "./pg";

const ORIGIN = new THREE.Vector3(0, 0, 0);
const DOWN_DIRECTION = new THREE.Vector3(0, -1, 0);
const UP_DIRECTION = new THREE.Vector3(0, 1, 0);

function getAttackAngleRadians(glidingRatio: number) {
  return Math.atan(1 / glidingRatio);
}

const createLiftArrow = (
  glidingRatio: number,
  len: number,
  color
): THREE.ArrowHelper => {
  const arrow = new THREE.ArrowHelper(UP_DIRECTION.clone(), ORIGIN, len, color);
  const axis = new THREE.Vector3(0, 0, 1);
  arrow.rotateOnAxis(axis, -getAttackAngleRadians(glidingRatio));
  return arrow;
};

const createTrajectoryArrow = (
  glidingRatio: number,
  len: number,
  color
): THREE.ArrowHelper => {
  const dir = new THREE.Vector3(1, 0, 0);
  const arrow = new THREE.ArrowHelper(dir, ORIGIN, len, color);
  const axis = new THREE.Vector3(0, 0, 1);
  arrow.rotateOnAxis(axis, -getAttackAngleRadians(glidingRatio));
  return arrow;
};

const createGravityArrow = (mesh: THREE.Object3D, len: number) => {
  const dir = DOWN_DIRECTION.clone();
  const arrow = new THREE.ArrowHelper(dir, ORIGIN, len, 0xff0000);
  return arrow;
};

const createDirectionArrow = (
  dir: THREE.Vector3,
  len: number,
  color
): THREE.ArrowHelper => {
  const arrow = new THREE.ArrowHelper(dir, ORIGIN, len, color);
  return arrow;
};

const createCentripetalArrow = (
  mesh: THREE.Object3D,
  len: number,
  color
): THREE.ArrowHelper => {
  const dir = new THREE.Vector3(0, -1, 0);
  const arrow = new THREE.ArrowHelper(dir, ORIGIN, len, color);
  return arrow;
};

export const addDebugArrowsToParaglider = (pg: Paraglider) => {
  const arrowLen = 50;
  const mesh = pg.mesh;
  mesh.add(createCentripetalArrow(mesh, arrowLen, 0x0000ff));
  mesh.add(createDirectionArrow(pg.direction(), arrowLen, 0x0000ff));
  mesh.add(createTrajectoryArrow(pg.glidingRatio(), arrowLen, 0xff00ff));
  mesh.add(createLiftArrow(pg.glidingRatio(), arrowLen, 0xffffff));
  mesh.add(createGravityArrow(pg.mesh, arrowLen));
};
