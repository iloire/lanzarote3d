import * as THREE from "three";
import Pilot from "./pilot";

const mat_wing = new THREE.MeshLambertMaterial({ color: 0x00ffff });

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
  for (let i = 0; i < 15; i++) {
    const w = 2 + i * 0.5;
    const h = 0.5 + i * 0.2;
    const deep = 10 + i * 2.8;
    distanceCajon += w * 0.9;
    const cajon = createCajon(w, h, deep);
    cajon.position.set(i * 3, distanceCajon, 0);
    group.add(cajon);
  }
  group.rotateZ(Math.PI / 2);
  group.rotateX(Math.PI / 2);
  return group;
};

const createWing = (): THREE.Mesh => {
  const wing = new THREE.Mesh();
  const halfWing = createHalfWing();
  const otherHalf = halfWing.clone();
  otherHalf.rotateX(Math.PI);
  otherHalf.translateY(-155);

  wing.add(halfWing);
  wing.add(otherHalf);

  wing.translateZ(-85);
  wing.translateY(80);
  return wing;
};

const createPilot = (): THREE.Object3D => {
  const pilot = new Pilot();
  return pilot.load();
};

class ParagliderModel {
  load(): THREE.Mesh {
    const model = new THREE.Mesh();
    const wing = createWing();
    model.add(wing);
    const pilot = createPilot();
    const scale = 0.03;
    pilot.scale.set(scale, scale, scale);
    pilot.rotateY(Math.PI / 2);
    model.add(pilot);

    return model;
  }
}

export default ParagliderModel;
