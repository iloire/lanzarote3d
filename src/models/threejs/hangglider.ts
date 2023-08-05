import * as THREE from "three";
import Pilot from "./pilot";
import Wing from "./parts/wing";
import GuiHelper from "../../utils/gui";
import Models from "../../utils/models";

const BREAK_ROTATION = 0.05;

class HangGliderModel {
  wing: Wing;
  pilot: Pilot;

  async load(gui?: any): Promise<THREE.Object3D> {
    // wing
    const wing = new Wing();
    const wingMesh = await wing.load();
    wingMesh.position.y = 10;
    wingMesh.position.x = -40;

    // pilot
    this.pilot = new Pilot({ helmetColor: 0xff0000 });
    const pilotMesh = this.pilot.load();
    const pilotScale = 0.03;
    pilotMesh.scale.set(pilotScale, pilotScale, pilotScale);
    pilotMesh.position.x = -5;
    pilotMesh.position.z = -0.4;
    pilotMesh.rotateY(Math.PI / 2);

    const group = new THREE.Group();
    group.add(pilotMesh);
    group.add(wingMesh);

    if (gui) {
      GuiHelper.addLocationGui(gui, "Hanglider pilot", pilotMesh);
      GuiHelper.addLocationGui(gui, "Hanglider", group);
    }
    return group;
  }
}

export default HangGliderModel;
