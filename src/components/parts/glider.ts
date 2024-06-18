import * as THREE from "three";
import GuiHelper from "../../utils/gui";

const halfWingLength = 4000; // mm

export type GliderOptions = {
  wingColor1: string;
  wingColor2: string;
  breakColor: string;
  inletsColor: string;
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

const createHalfWing = (options: GliderOptions): HalfWing => {
  const mat_wing = new THREE.MeshLambertMaterial({ color: options.wingColor1 });
  const mat_break = new THREE.MeshLambertMaterial({ color: options.breakColor });
  const mat_frontCajon = new THREE.MeshLambertMaterial({ color: options.inletsColor });
  const lineMat = new THREE.LineBasicMaterial({
    color: options.lineBackColor,
    transparent: true,
    opacity: 0.2,
  });

  const group = new THREE.Mesh();
  let distanceCajon = 0;
  const lineLocations = []; // array to hold the points of the line segments
  const wingBreakSystem = new THREE.Group();
  const frontCajones = new THREE.Group();

  let shape = 0;

  for (let n = 0; n < options.numeroCajones; n++) {
    const cajonWidth = halfWingLength / options.numeroCajones;
    const cajonHeight = 10 + n * 5;
    const deep = 700 + n * 35;

    distanceCajon += cajonWidth;

    const cajon = createCajon(cajonWidth, cajonHeight, deep, mat_wing);

    shape = shape + (options.numeroCajones - n) * 3.05;
    cajon.position.set(shape, distanceCajon, 0);

    const breakDeep = deep / 10;
    const breakBox = createCajon(cajonWidth, cajonHeight, breakDeep, mat_break);
    breakBox.position.set(shape, distanceCajon, deep / 2 + breakDeep);

    const frontCajonDeep = deep / 30;
    const frontCajon = createCajon(cajonWidth, cajonHeight, frontCajonDeep, mat_frontCajon);
    frontCajon.position.set(shape, distanceCajon, -deep / 2 - frontCajonDeep);

    if (n % 8 === 0) {
      //lines
      const carabinerLocation = new THREE.Vector3(-3000, halfWingLength, 0);
      lineLocations.push(new THREE.Vector3(shape, distanceCajon, deep * 0.5));
      lineLocations.push(carabinerLocation);

      lineLocations.push(new THREE.Vector3(shape, distanceCajon, -deep * 0.5));
      lineLocations.push(carabinerLocation);
    }
    group.add(cajon);
    wingBreakSystem.add(breakBox);
    frontCajones.add(frontCajon);
  }

  group.add(wingBreakSystem);
  group.add(frontCajones);

  group.rotateZ(Math.PI / 2);
  group.rotateX(Math.PI / 2);
  const geometry = new THREE.BufferGeometry().setFromPoints(lineLocations); // create the geometry from the points
  const lineSegments = new THREE.LineSegments(geometry, lineMat); // create the line segments
  group.add(lineSegments);

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

    this.leftWing = createHalfWing(this.options);
    this.leftWing.wing.scale.z = -1;

    this.rightWing = { wing: this.leftWing.wing.clone(), wingBreakSystem: this.leftWing.wingBreakSystem.clone() };
    this.rightWing.wing.scale.y = -1;
    this.rightWing.wing.translateY(halfWingLength * 2);

    this.fullWing.add(this.leftWing.wing);
    this.fullWing.add(this.rightWing.wing);

    this.fullWing.translateZ(-1 * halfWingLength);
    this.fullWing.translateY(3000);
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
