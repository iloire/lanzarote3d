import * as THREE from "three";
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
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xc2c2c2,
    opacity: 0.1,
  }); // blue color
  const points = []; // array to hold the points of the line segments
  for (let i = 0; i < numeroCajones; i++) {
    const w = 2 + i * 0.5;
    const h = 0.5 + i * 0.2;
    const deep = 10 + i * 2.8;
    distanceCajon += w * 0.8;
    const cajon = createCajon(w, h, deep);
    const x = i * 1.9 - 2 * h;
    cajon.position.set(x, distanceCajon, 0);
    group.add(cajon);

    if (i % 4 === 0) {
      //lines
      const handLocation = new THREE.Vector3(-75, 70, -3);
      points.push(new THREE.Vector3(i * 1.5, distanceCajon, deep * 0.5)); // start point of first segment
      points.push(handLocation);

      points.push(new THREE.Vector3(i * 1.5, distanceCajon, -deep * 0.5)); // start point of first segment
      points.push(handLocation);
    }
  }
  group.rotateZ(Math.PI / 2);
  group.rotateX(Math.PI / 2);
  const geometry = new THREE.BufferGeometry().setFromPoints(points); // create the geometry from the points
  const lineSegments = new THREE.LineSegments(geometry, lineMat); // create the line segments
  group.add(lineSegments);
  return group;
};

class Glider {
  leftWing: THREE.Object3D;
  rightWing: THREE.Object3D;
  wing: THREE.Mesh;
  initialLeftWingRotation: number;
  initialRightWingRotation: number;

  createWing(): THREE.Mesh {
    this.wing = new THREE.Mesh();

    this.leftWing = createHalfWing();
    this.leftWing.scale.z = -1;
    this.initialLeftWingRotation = this.leftWing.rotation.y;

    this.rightWing = this.leftWing.clone();
    this.rightWing.scale.y = -1;
    this.rightWing.translateY(155);
    this.initialRightWingRotation = this.rightWing.rotation.y;

    this.wing.add(this.leftWing);
    this.wing.add(this.rightWing);

    this.wing.translateZ(-78);
    this.wing.translateY(80);
    return this.wing;
  }

  async load(gui?: any): Promise<THREE.Mesh> {
    const wing = this.createWing();
    if (gui) {
      GuiHelper.addLocationGui(gui, "leftWing", this.leftWing);
      GuiHelper.addLocationGui(gui, "rightWing", this.rightWing);
      GuiHelper.addLocationGui(gui, "wing", this.wing);
    }
    return wing;
  }
}

export default Glider;
