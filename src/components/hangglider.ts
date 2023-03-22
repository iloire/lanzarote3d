import * as THREE from "three";
import Pilot from "./pilot";
import Wing from "./wing";
import GuiHelper from "../utils/gui";
import Models from "../utils/models";

const BREAK_ROTATION = 0.05;

class HangGliderModel {
  wing: Wing;
  pilot: Pilot;
  pilotMesh: THREE.Object3D;

  async load(gui?: any): Promise<THREE.Mesh> {
    const model = new THREE.Mesh();
    this.wing = new Wing();
    const wing = this.wing.createWing();
    wing.position.y = 10;
    wing.position.x = -40;
    model.add(wing);

    this.pilot = new Pilot();
    this.pilotMesh = this.pilot.load();

    const scale = 0.03;
    this.pilotMesh.scale.set(scale, scale, scale);
    this.pilotMesh.position.x = -5;
    this.pilotMesh.position.z = -0.4;
    this.pilotMesh.rotateY(Math.PI / 2);
    model.add(this.pilotMesh);

    if (gui) {
      GuiHelper.addLocationGui(gui, "pilot", this.pilotMesh);
      GuiHelper.addLocationGui(gui, "paraglider", model);
    }
    return model;
  }

  getPilotPosition(): THREE.Vector3 {
    return this.pilotMesh.position.clone();
  }
}

export default HangGliderModel;
