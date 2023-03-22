class AutoFlier {
  currentPointIndex: number = 0;
  path: THREE.Vector3[];
  mesh: THREE.Mesh;

  position() {
    return this.mesh.position.clone();
  }

  move() {
    const nextPointToTravel = this.path[this.currentPointIndex];
    const velocity = nextPointToTravel.clone().sub(this.position()).normalize();
    this.mesh.position.add(velocity.multiplyScalar(1));

    if (nextPointToTravel.distanceTo(this.position()) < 10) {
      if (this.currentPointIndex < this.path.length - 1) {
        this.currentPointIndex++;
      } else {
        this.currentPointIndex = 0;
      }
    }
  }
}

export default AutoFlier;
