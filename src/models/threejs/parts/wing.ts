import * as THREE from "three";
import GuiHelper from "../../../utils/gui";

const mat_wing = new THREE.MeshLambertMaterial({ color: 0x00ffff });
const mat_break = new THREE.MeshLambertMaterial({ color: 0xffffff });

const numeroCajones = 16;

type HalfWing = {
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
  const points = []; // array to hold the points of the line segments
  for (let i = 0; i < numeroCajones; i++) {
    const w = 2 + i * 0.5;
    const h = 0.5 + i * 0.2;
    const deep = 8 + i * 5;
    distanceCajon += w * 0.8;

    const cajon = createCajon(w, h, deep, mat_wing);
    cajon.position.set(h, distanceCajon, 0 - deep / 2);

    group.add(cajon);
  }
  group.rotateZ(Math.PI / 2);
  group.rotateX(Math.PI / 2);
  if (scale) {
    group.scale.set(scale.x, scale.y, scale.z);
  }
  return { wing: group };
};

class Wing {
  leftWing: HalfWing;
  rightWing: HalfWing;

  async load(gui?: any): Promise<THREE.Mesh> {
    const fullWing = new THREE.Mesh();

    const leftWing = createHalfWing(new THREE.Vector3(1, 1, -1));
    const rightWing = createHalfWing(new THREE.Vector3(1, -1, -1));
    rightWing.wing.translateY(155);

    fullWing.add(leftWing.wing);
    fullWing.add(rightWing.wing);

    fullWing.translateZ(-78);
    if (gui) {
      GuiHelper.addLocationGui(gui, "leftWing", leftWing.wing);
      GuiHelper.addLocationGui(gui, "rightWing", rightWing.wing);
      GuiHelper.addLocationGui(gui, "wing", fullWing);
    }
    return fullWing;
  }
}

export default Wing;
