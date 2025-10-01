import * as THREE from 'three';
import TandemPilot, { TandemPilotOptions } from '../../characters/TandemPilot';
import LegacyGlider, { GliderOptions } from '../components/Glider';

export type TandemOptions = {
  glider: GliderOptions;
  pilot: TandemPilotOptions;
};

class Tandem {
  options: TandemOptions;

  constructor(options: TandemOptions) {
    this.options = options;
  }

  async load(): Promise<THREE.Object3D> {
    const mesh = new THREE.Object3D();

    const glider = new LegacyGlider(this.options.glider);

    const wing = glider.createWing();
    wing.position.y = 2800;
    wing.position.x = 300;
    mesh.add(wing);

    const pilot = new TandemPilot(this.options.pilot);
    const pilotMesh = await pilot.load();

    pilotMesh.position.x = 17;
    pilotMesh.position.z = -0.4;
    pilotMesh.rotateY(Math.PI / 2);

    mesh.add(pilotMesh);

    return mesh;
  }
}

export default Tandem;
