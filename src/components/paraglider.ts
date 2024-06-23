import * as THREE from "three";
import Pilot, { PilotOptions } from "./pilot";
import Glider, { GliderOptions } from "./parts/glider";
import GuiHelper from "../utils/gui";
import IFlyable from './base/IFlyable';

export type ParagliderOptions = {
  glider: GliderOptions;
  pilot: PilotOptions;
}

class Paraglider implements IFlyable {
  mesh: THREE.Object3D;
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

  left() {
    this.glider.breakLeft();
    this.pilot.breakLeft();
    console.log('paraglider model left');
  }

  leftRelease() {
    this.pilot.breakLeftRelease();
  }

  right() {
    this.glider.breakRight();
    this.pilot.breakRight();
    console.log('paraglider model right');
  }

  rightRelease() {
    this.pilot.breakRightRelease();
  }

  speedBar() {
    this.pilot.speedBar();
  }

  releaseSpeedBar() {
    this.pilot.releaseSpeedBar();
  }


  getMesh() {
    if (!this.mesh) {
      throw Error('mesh not loaded - use load');
    }
    return this.mesh;
  }

  async load(gui?: any): Promise<THREE.Object3D> {
    this.mesh = new THREE.Object3D();

    this.glider = new Glider(this.options.glider);

    const wing = await this.glider.load();
    wing.translateY(-300);
    wing.translateX(300);
    this.mesh.add(wing);


    this.pilot = new Pilot(this.options.pilot);
    this.pilotMesh = this.pilot.load();

    this.pilotMesh.position.x = 17;
    this.pilotMesh.position.z = -0.4;
    this.pilotMesh.rotateY(Math.PI / 2);

    this.mesh.add(this.pilotMesh);

    if (gui) {
      GuiHelper.addLocationGui(gui, "Pilot model", this.pilotMesh);
      GuiHelper.addLocationGui(gui, "Paraglider model", this.mesh);
    }

    this.axesHelper = new THREE.AxesHelper(100);
    this.axesHelper.visible = false;
    this.mesh.add(this.axesHelper);
    return this.mesh;
  }

}

export default Paraglider;
