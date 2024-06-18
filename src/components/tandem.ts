import * as THREE from "three";
import TandemPilot, { TandemPilotOptions } from "./tandem-pilot";
import Glider, { GliderOptions } from "./parts/glider";

export type TandemOptions = {
  glider: GliderOptions;
  pilot: TandemPilotOptions;
}

class Tandem {
  options: TandemOptions;

  constructor(options: TandemOptions) {
    this.options = options;
  }

  async load(gui?: any): Promise<THREE.Object3D> {
    const mesh = new THREE.Object3D();

    const glider = new Glider(this.options.glider);

    const wing = glider.createWing();
    wing.position.y = 2800;
    wing.position.x = 300;
    mesh.add(wing);


    const pilot = new TandemPilot(this.options.pilot);
    const pilotMesh = pilot.load();

    pilotMesh.position.x = 17;
    pilotMesh.position.z = -0.4;
    pilotMesh.rotateY(Math.PI / 2);

    mesh.add(pilotMesh);

    return mesh;
  }
}

export default Tandem;
