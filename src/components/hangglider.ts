import * as THREE from "three";
import Pilot from "./pilot";
import Wing from "./parts/wing";
import GuiHelper from "../utils/gui";
import Models from "../utils/models";
import AutoFlier from "./base/auto-flier";
import { PilotHeadType } from "./parts/pilot-head";

const BREAK_ROTATION = 0.05;

const DEFAULT_OPTIONS = {
  head: {
    headType: PilotHeadType.Default,
    helmetOptions: {
      color: '#ffffff',
      color2: '#cccccc',
      color3: '#999999'
    }
  }
  // ... rest of options
};

class HangGliderModel extends AutoFlier {
  wing: Wing;
  pilot: Pilot;

  async load(path: THREE.Vector3[], gui?: any): Promise<THREE.Mesh> {
    this.path = path;
    this.mesh = new THREE.Mesh();

    // wing
    const wing = new Wing();
    const wingMesh = await wing.load();
    wingMesh.position.y = 10;
    wingMesh.position.x = -40;

    // pilot
    this.pilot = new Pilot(DEFAULT_OPTIONS);
    const pilotMesh = this.pilot.load();
    const pilotScale = 0.03;
    pilotMesh.scale.set(pilotScale, pilotScale, pilotScale);
    pilotMesh.position.x = -5;
    pilotMesh.position.z = -0.4;
    pilotMesh.rotateY(Math.PI / 2);

    this.mesh.add(pilotMesh);
    this.mesh.add(wingMesh);

    if (path.length > 1) {
      this.mesh.position.copy(path[0]);
    }

    if (gui) {
      GuiHelper.addLocationGui(gui, "Hanglider pilot", pilotMesh);
      GuiHelper.addLocationGui(gui, "Hanglider", this.mesh);
    }

    this.animate();
    return this.mesh;
  }

  animate() {
    if (this.path.length) {
      this.move();
    }
    requestAnimationFrame(() => this.animate());
  }
}

export default HangGliderModel;
