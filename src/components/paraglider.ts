import * as THREE from "three";
import Pilot from "./pilot";
import GuiHelper from "../utils/gui";

const mat_wing = new THREE.MeshLambertMaterial({ color: 0x00ffff });
const numeroCajones = 16;

const createCajon = (w: number, h: number, deep: number): THREE.Mesh => {
  const geo = new THREE.BoxGeometry(w, h, deep);
  const cajon = new THREE.Mesh(geo, mat_wing);
  cajon.castShadow = true;
  cajon.rotation.set(0, 0, Math.PI / 2);
  return cajon;
};

const createHalfWing = (): THREE.Mesh => {
  const group = new THREE.Mesh();
  let distanceCajon = 0;
  for (let i = 0; i < numeroCajones; i++) {
    const w = 2 + i * 0.5;
    const h = 0.5 + i * 0.2;
    const deep = 10 + i * 2.8;
    distanceCajon += w * 0.8;
    const cajon = createCajon(w, h, deep);
    cajon.position.set(i * 1.9 - 2 * h, distanceCajon, 0);
    group.add(cajon);
  }
  group.rotateZ(Math.PI / 2);
  group.rotateX(Math.PI / 2);
  return group;
};

const createPilot = (): THREE.Object3D => {
  const pilot = new Pilot();
  return pilot.load();
};

const createLines = (): THREE.Object3D => {
  const material = new THREE.LineBasicMaterial({ color: 0x0000ff }); // blue color
  const points = []; // array to hold the points of the line segments

  points.push(new THREE.Vector3(1, -1, -40)); // start point of first segment
  points.push(new THREE.Vector3(5, -120, 0)); // end point of first segment

  points.push(new THREE.Vector3(1, -1, 40)); // start point of second segment
  points.push(new THREE.Vector3(5, -120, 0)); // end point of second segment

  const geometry = new THREE.BufferGeometry().setFromPoints(points); // create the geometry from the points
  const lineSegments = new THREE.LineSegments(geometry, material); // create the line segments
  return lineSegments;
};

class ParagliderModel {
  leftWing: THREE.Object3D;
  rightWing: THREE.Object3D;
  wing: THREE.Mesh;
  pilot: THREE.Mesh;
  initialLeftWingRotation: number;
  initialRightWingRotation: number;

  breakLeft() {
    this.leftWing.rotation.y = this.initialLeftWingRotation + 0.2;
  }

  breakRight() {
    this.rightWing.rotation.y = this.initialRightWingRotation - 0.2;
  }

  handsUp() {
    this.rightWing.rotation.y = this.initialRightWingRotation;
    this.leftWing.rotation.y = this.initialLeftWingRotation;
  }

  createWing(): THREE.Mesh {
    this.wing = new THREE.Mesh();

    this.leftWing = createHalfWing();
    this.initialLeftWingRotation = this.leftWing.rotation.y;

    this.rightWing = this.leftWing.clone();
    this.rightWing.rotateX(Math.PI);
    this.rightWing.translateY(-155);
    this.initialRightWingRotation = this.rightWing.rotation.y;

    this.wing.add(this.leftWing);
    this.wing.add(this.rightWing);

    this.wing.translateZ(-78);
    this.wing.translateY(80);
    return this.wing;
  }

  load(gui?: any): THREE.Mesh {
    const model = new THREE.Mesh();
    const wing = this.createWing();
    wing.position.y = -30;
    model.add(wing);

    const pilot = createPilot();
    const scale = 0.03;
    pilot.scale.set(scale, scale, scale);
    pilot.position.y = -110;
    pilot.rotateY(Math.PI / 2);
    model.add(pilot);

    const lines = createLines();
    model.add(lines);

    if (gui) {
      GuiHelper.addLocationGui(gui, "leftWing", this.leftWing);
      GuiHelper.addLocationGui(gui, "rightWing", this.rightWing);
      GuiHelper.addLocationGui(gui, "pilot", pilot);
    }
    return model;
  }
}

export default ParagliderModel;
