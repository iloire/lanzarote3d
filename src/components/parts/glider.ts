import * as THREE from "three";
import GuiHelper from "../../utils/gui";

const halfWingLength = 80;

export type GliderOptions = {
  wingColor1: string;
  wingColor2: string;
  breakColor: string;
  lineFrontColor: string;
  lineBackColor: string;
  numeroCajones: number;
}

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

const createHalfWing = (options: GliderOptions, scale?: THREE.Vector3): HalfWing => {
  const mat_wing = new THREE.MeshLambertMaterial({ color: options.wingColor1 });
  const mat_break = new THREE.MeshLambertMaterial({ color: options.breakColor });
  const lineMat = new THREE.LineBasicMaterial({
    color: options.lineBackColor,
    opacity: 0.01,
  });

  const group = new THREE.Mesh();
  let distanceCajon = 0;
  const lineLocations = []; // array to hold the points of the line segments
  const wingBreakSystem = new THREE.Group();

  let x = 0;

  for (let n = 0; n < options.numeroCajones; n++) {
    console.log('wo')
    const w = halfWingLength / options.numeroCajones;
    const h = n * 0.2;
    const deep = 8 + n * 1.2;

    distanceCajon += w;

    const cajon = createCajon(w, h, deep, mat_wing);

    x = x + (options.numeroCajones - n) * 0.05;
    cajon.position.set(x, distanceCajon, 0);

    const breakDeep = deep / 10;
    const breakBox = createCajon(w, h, breakDeep, mat_break);
    breakBox.position.set(x, distanceCajon, deep / 2);

    group.add(cajon);
    wingBreakSystem.add(breakBox);

    if (n % 6 === 0) {
      //lines
      const carabinerLocation = new THREE.Vector3(-84.5, 75, -3);
      lineLocations.push(new THREE.Vector3(x, distanceCajon, deep * 0.5));
      lineLocations.push(carabinerLocation);

      lineLocations.push(new THREE.Vector3(x, distanceCajon, -deep * 0.5));
      lineLocations.push(carabinerLocation);
    }
  }
  group.add(wingBreakSystem);
  group.rotateZ(Math.PI / 2);
  group.rotateX(Math.PI / 2);
  const geometry = new THREE.BufferGeometry().setFromPoints(lineLocations); // create the geometry from the points
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

  options: GliderOptions

  constructor(options: GliderOptions) {
    this.options = options;
  }

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

    this.leftWing = createHalfWing(this.options, new THREE.Vector3(1, 1, -1));
    this.rightWing = createHalfWing(this.options, new THREE.Vector3(1, -1, -1));
    this.rightWing.wing.translateY(halfWingLength * 2);

    this.fullWing.add(this.leftWing.wing);
    this.fullWing.add(this.rightWing.wing);

    this.fullWing.translateZ(-78);
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
