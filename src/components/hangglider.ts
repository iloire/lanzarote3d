import * as THREE from "three";
import Pilot from "./pilot";
import Wing from "./wing";
import GuiHelper from "../utils/gui";
import Models from "../utils/models";

const BREAK_ROTATION = 0.05;

class HangGliderModel {
  currentPointIndex: number = 0;
  path: THREE.Vector3[];
  mesh: THREE.Mesh;
  wing: Wing;
  pilot: Pilot;
  pilotMesh: THREE.Object3D;

  async load(path: THREE.Vector3[], gui?: any): Promise<THREE.Mesh> {
    this.path = path;
    this.mesh = new THREE.Mesh();
    this.wing = new Wing();

    const wing = this.wing.createWing();
    wing.position.y = 10;
    wing.position.x = -40;
    this.mesh.add(wing);

    if (path.length > 1) {
      this.mesh.position.copy(path[0]);
    }

    this.pilot = new Pilot();
    this.pilotMesh = this.pilot.load();

    const scale = 0.03;
    this.pilotMesh.scale.set(scale, scale, scale);
    this.pilotMesh.position.x = -5;
    this.pilotMesh.position.z = -0.4;
    this.pilotMesh.rotateY(Math.PI / 2);
    this.mesh.add(this.pilotMesh);

    if (gui) {
      GuiHelper.addLocationGui(gui, "pilot", this.pilotMesh);
      GuiHelper.addLocationGui(gui, "paraglider", this.mesh);
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

  getPilotPosition(): THREE.Vector3 {
    return this.pilotMesh.position.clone();
  }

  move() {
    const nextPointToTravel = this.path[this.currentPointIndex];
    const velocity = nextPointToTravel
      .clone()
      .sub(this.mesh.position)
      .normalize();
    this.mesh.position.add(velocity.multiplyScalar(1));

    if (nextPointToTravel.distanceTo(this.mesh.position) < 10) {
      if (this.currentPointIndex < this.path.length - 1) {
        this.currentPointIndex++;
      } else {
        this.currentPointIndex = 0;
      }
    }
  }
}

export default HangGliderModel;
