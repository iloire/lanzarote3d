import * as THREE from "three";

const FORWARD_DIRECTION = new THREE.Vector3(1, 0, 0);

class AutoFlier {
  currentPointIndex: number = 0;
  path: THREE.Vector3[];
  mesh: THREE.Mesh;
  wrapMultiplier: number = 1;

  position(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  updateWrapSpeed(multiplier: number) {
    this.wrapMultiplier = multiplier;
  }

  move() {
    if (this.path.length < 2) {
      return;
    }

    const nextPointToTravel = this.path[this.currentPointIndex];
    const velocity = nextPointToTravel.clone().sub(this.position()).normalize();
    this.mesh.position.add(velocity.multiplyScalar(this.wrapMultiplier));

    if (nextPointToTravel.distanceTo(this.position()) < 10) {
      if (this.currentPointIndex < this.path.length - 1) {
        this.currentPointIndex++;
      } else {
        this.currentPointIndex = 0;
      }
    }

    this.mesh.lookAt(nextPointToTravel);
  }
}

export default AutoFlier;
