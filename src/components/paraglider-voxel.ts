import * as THREE from "three";
import PilotVoxel, { PilotVoxelOptions } from "./pilot-voxel";
import Glider, { GliderOptions } from "./parts/glider";
import GuiHelper from "../utils/gui";
import IFlyable from './base/IFlyable';

export type ParagliderVoxelOptions = {
  glider: GliderOptions;
  pilot: PilotVoxelOptions;
}

class ParagliderVoxel implements IFlyable {
  mesh: THREE.Object3D;
  glider: Glider;
  pilot: PilotVoxel;
  pilotMesh: THREE.Object3D;
  axesHelper: THREE.AxesHelper;
  options: ParagliderVoxelOptions;

  constructor(options: ParagliderVoxelOptions) {
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
    console.log('paraglider model left');
  }

  leftRelease() {
  }

  right() {
    this.glider.breakRight();
    console.log('paraglider model right');
  }

  rightRelease() {
  }

  speedBar() {
  }

  releaseSpeedBar() {
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


    this.pilot = new PilotVoxel(this.options.pilot);
    this.pilotMesh = await this.pilot.load();

    this.pilotMesh.position.x = 350;
    this.pilotMesh.position.y = -600;
    this.pilotMesh.position.z = 0;
    const scale = 150;
    this.pilotMesh.scale.set(scale, scale, scale);
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

export default ParagliderVoxel;
