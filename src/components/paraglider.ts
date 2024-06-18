import * as THREE from "three";
import Pilot, { PilotOptions } from "./pilot";
import Glider, { GliderOptions } from "./parts/glider";
import GuiHelper from "../utils/gui";

export type ParagliderOptions = {
  glider: GliderOptions;
  pilot: PilotOptions;
}

class ParagliderModel {
  glider: Glider;
  pilot: Pilot;
  pilotMesh: THREE.Object3D;
  axesHelper: THREE.AxesHelper;
  options: ParagliderOptions;

  constructor(options: ParagliderOptions) {
    this.options = options;
  }

  showAxesHelper() {
    this.axesHelper.visible = true;
  }

  toggleAxesHelper() {
    this.axesHelper.visible = !this.axesHelper.visible;
  }

  breakLeft() {
    this.glider.breakLeft();
    this.pilot.breakLeft();
  }

  breakRight() {
    this.glider.breakRight();
    this.pilot.breakRight();
  }

  handsUp() {
    this.glider.handsUp();
    this.pilot.handsUp();
  }

  speedBar() {
    this.pilot.speedBar();
  }

  releaseSpeedBar() {
    this.pilot.releaseSpeedBar();
  }

  setFirstPersonView(isFirstPersonView: boolean) {
    if (isFirstPersonView) {
      console.log("hide");
      this.pilot.hideHead();
    } else {
      console.log("show");
      this.pilot.showHead();
    }
  }

  async load(gui?: any): Promise<THREE.Object3D> {
    const mesh = new THREE.Object3D();

    this.glider = new Glider(this.options.glider);

    const wing = this.glider.createWing();
    wing.position.y = 80;
    wing.position.x = 22;
    mesh.add(wing);

    const pilotOptions = {
      head: { helmetColor: '#ffff00' }
    }

    this.pilot = new Pilot(pilotOptions);
    this.pilotMesh = this.pilot.load();

    const scale = 0.03;
    this.pilotMesh.scale.set(scale, scale, scale);
    this.pilotMesh.position.x = 17;
    this.pilotMesh.position.z = -0.4;
    this.pilotMesh.rotateY(Math.PI / 2);
    mesh.add(this.pilotMesh);

    if (gui) {
      GuiHelper.addLocationGui(gui, "Pilot model", this.pilotMesh);
      GuiHelper.addLocationGui(gui, "Paraglider model", mesh);
    }

    this.axesHelper = new THREE.AxesHelper(100);
    this.axesHelper.visible = false;
    mesh.add(this.axesHelper);
    return mesh;
  }

  getPilotPosition(): THREE.Vector3 {
    return this.pilotMesh.position.clone();
  }
}

export default ParagliderModel;
