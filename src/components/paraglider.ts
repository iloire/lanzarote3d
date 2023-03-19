import * as THREE from "three";
import Pilot from "./pilot";
import Glider from "./glider";
import GuiHelper from "../utils/gui";
// import modelHarness from "../models/hawklowv4.glb";
import Models from "../utils/models";

const BREAK_ROTATION = 0.05;

class ParagliderModel {
  leftWing: THREE.Object3D;
  rightWing: THREE.Object3D;
  wing: THREE.Mesh;
  pilotMesh: THREE.Object3D;
  initialLeftWingRotation: number;
  initialRightWingRotation: number;

  breakLeft() {
    this.leftWing.rotation.y = this.initialLeftWingRotation + BREAK_ROTATION;
  }

  breakRight() {
    this.rightWing.rotation.y = this.initialRightWingRotation + BREAK_ROTATION;
  }

  handsUp() {
    this.rightWing.rotation.y = this.initialRightWingRotation;
    this.leftWing.rotation.y = this.initialLeftWingRotation;
  }

  async load(gui?: any): Promise<THREE.Mesh> {
    const model = new THREE.Mesh();
    const glider = new Glider();
    const wing = glider.createWing();
    wing.position.y = 80;
    model.add(wing);

    const pilot = new Pilot();
    this.pilotMesh = pilot.load();
    const scale = 0.03;
    this.pilotMesh.scale.set(scale, scale, scale);
    this.pilotMesh.position.x = -5;
    this.pilotMesh.rotateY(Math.PI / 2);
    model.add(this.pilotMesh);

    // const harness = await Models.loadSimple(modelHarness);
    // harness.rotateY(Math.PI);
    // harness.position.set(70, -20, 0);
    // const scaleHarness = 0.4;
    // harness.scale.set(scaleHarness, scaleHarness, scaleHarness);
    //
    // model.add(harness);

    if (gui) {
      GuiHelper.addLocationGui(gui, "pilot", this.pilotMesh);
      GuiHelper.addLocationGui(gui, "paraglider", model);
      // GuiHelper.addLocationGui(gui, "harness", harness);
    }
    return model;
  }

  getPilotPosition(): THREE.Vector3 {
    return this.pilotMesh.position.clone();
  }
}

export default ParagliderModel;
