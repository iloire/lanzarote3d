import * as THREE from "three";
import Pilot from "./pilot";
import Glider from "./glider";
import GuiHelper from "../utils/gui";
import Models from "../utils/models";

const BREAK_ROTATION = 0.05;

class ParagliderModel {
  glider: Glider;
  pilotMesh: THREE.Object3D;

  breakLeft() {
    this.glider.breakLeft();
  }

  breakRight() {
    this.glider.breakRight();
  }

  handsUp() {
    this.glider.handsUp();
  }

  async load(gui?: any): Promise<THREE.Mesh> {
    const model = new THREE.Mesh();
    this.glider = new Glider();
    const wing = this.glider.createWing();
    wing.position.y = 80;
    model.add(wing);

    const pilot = new Pilot();
    this.pilotMesh = pilot.load();
    const scale = 0.03;
    this.pilotMesh.scale.set(scale, scale, scale);
    this.pilotMesh.position.x = -5;
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

export default ParagliderModel;
