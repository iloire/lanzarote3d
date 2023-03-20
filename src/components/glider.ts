import * as THREE from "three";
import GuiHelper from "../utils/gui";

const mat_wing = new THREE.MeshLambertMaterial({ color: 0x00ffff });
const mat_break = new THREE.MeshLambertMaterial({ color: 0xffffff });
const numeroCajones = 16;

type HalfWing = {
  wingBreakSystem: THREE.Object3D;
  wing: THREE.Object3D;
};

const createCajon = (
  w: number,
  h: number,
  deep: number,
  mat: THREE.MeshLambertMaterial
): THREE.Mesh => {
  const geo = new THREE.BoxGeometry(w, h, deep);
  const cajon = new THREE.Mesh(geo, mat);
  cajon.castShadow = true;
  cajon.rotation.set(0, 0, Math.PI / 2);
  return cajon;
};

const createHalfWing = (scale?: THREE.Vector3): HalfWing => {
  const group = new THREE.Mesh();
  let distanceCajon = 0;
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xc2c2c2,
    opacity: 0.1,
  }); // blue color
  const points = []; // array to hold the points of the line segments
  const wingBreakSystem = new THREE.Group();
  for (let i = 0; i < numeroCajones; i++) {
    const w = 2 + i * 0.5;
    const h = 0.5 + i * 0.2;
    const deep = 8 + i * 2.8;
    distanceCajon += w * 0.8;
    const x = i * 1.9 - 2 * h;

    const cajon = createCajon(w, h, deep, mat_wing);
    cajon.position.set(x, distanceCajon, 0);

    const breakDeep = deep / 10;
    const breakBox = createCajon(w, h, breakDeep, mat_break);
    breakBox.position.set(x, distanceCajon, deep / 2);

    group.add(cajon);
    wingBreakSystem.add(breakBox);

    if (i % 4 === 0) {
      //lines
      const carabinerLocation = new THREE.Vector3(-84.5, 75, -3);
      points.push(new THREE.Vector3(i * 1.5, distanceCajon, deep * 0.5));
      points.push(carabinerLocation);

      points.push(new THREE.Vector3(i * 1.5, distanceCajon, -deep * 0.5));
      points.push(carabinerLocation);
    }
  }
  group.add(wingBreakSystem);
  group.rotateZ(Math.PI / 2);
  group.rotateX(Math.PI / 2);
  const geometry = new THREE.BufferGeometry().setFromPoints(points); // create the geometry from the points
  const lineSegments = new THREE.LineSegments(geometry, lineMat); // create the line segments
  group.add(lineSegments);
  if (scale) {
    group.scale.set(scale.x, scale.y, scale.z);
  }
  return { wing: group, wingBreakSystem };
};

class Glider {
  leftWing: HalfWing;
  rightWing: HalfWing;
  fullWing: THREE.Mesh;

  breakLeft() {
    this.leftWing.wingBreakSystem.position.x = -3;
  }

  breakRight() {
    this.rightWing.wingBreakSystem.position.x = -3;
  }

  handsUp() {
    this.leftWing.wingBreakSystem.position.x = 0;
    this.rightWing.wingBreakSystem.position.x = 0;
  }

  createWing(): THREE.Mesh {
    this.fullWing = new THREE.Mesh();

    this.leftWing = createHalfWing(new THREE.Vector3(1, 1, -1));
    this.rightWing = createHalfWing(new THREE.Vector3(1, -1, -1));
    this.rightWing.wing.translateY(155);

    this.fullWing.add(this.leftWing.wing);
    this.fullWing.add(this.rightWing.wing);

    this.fullWing.translateZ(-78);
    this.fullWing.translateY(80);
    return this.fullWing;
  }

  async load(gui?: any): Promise<THREE.Mesh> {
    const wing = this.createWing();
    if (gui) {
      GuiHelper.addLocationGui(gui, "leftWing", this.leftWing.wing);
      GuiHelper.addLocationGui(gui, "rightWing", this.rightWing.wing);
      GuiHelper.addLocationGui(gui, "wing", this.fullWing);
    }
    return wing;
  }
}

export default Glider;
