import * as THREE from 'three';

export interface AutoFlierOptions {
  speed?: number;
  arrivalThreshold?: number;
  smoothRotation?: boolean;
  rotationSpeed?: number;
  forwardAxis?: 'x' | 'y' | 'z' | '-x' | '-y' | '-z';
}

class AutoFlier {
  currentPointIndex: number = 0;
  path: THREE.Vector3[] = [];
  mesh!: THREE.Mesh;
  private speed: number = 1;
  private arrivalThreshold: number = 10;
  private smoothRotation: boolean = true;
  private rotationSpeed: number = 0.1;
  private forwardAxis: 'x' | 'y' | 'z' | '-x' | '-y' | '-z' = 'z';
  private targetQuaternion: THREE.Quaternion = new THREE.Quaternion();

  constructor(options: AutoFlierOptions = {}) {
    this.speed = options.speed ?? 1;
    this.arrivalThreshold = options.arrivalThreshold ?? 10;
    this.smoothRotation = options.smoothRotation ?? true;
    this.rotationSpeed = options.rotationSpeed ?? 0.1;
    this.forwardAxis = options.forwardAxis ?? 'z';
  }

  position(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  updateWrapSpeed(multiplier: number) {
    this.speed = multiplier;
  }

  updateSpeed(speed: number) {
    this.speed = speed;
  }

  updateArrivalThreshold(threshold: number) {
    this.arrivalThreshold = threshold;
  }

  getForwardAxis(): 'x' | 'y' | 'z' | '-x' | '-y' | '-z' {
    return this.forwardAxis;
  }

  private orientTowardsTarget(targetPosition: THREE.Vector3) {
    if (!this.mesh) return;

    const direction = targetPosition.clone().sub(this.position()).normalize();

    if (direction.length() === 0) return;

    // Simpler approach: use lookAt but with corrective rotation

    // Create a temporary object to get the lookAt rotation
    const tempObject = new THREE.Object3D();
    tempObject.position.copy(this.position());
    tempObject.lookAt(targetPosition);

    // Apply corrective rotation based on model's forward axis
    let correction = new THREE.Euler();
    switch (this.forwardAxis) {
      case 'x':
        correction.set(0, -Math.PI / 2, 0); // Rotate -90° around Y
        break;
      case '-x':
        correction.set(0, Math.PI / 2, 0); // Rotate 90° around Y
        break;
      case 'y':
        correction.set(-Math.PI / 2, 0, 0); // Rotate -90° around X to point forward
        break;
      case '-y':
        correction.set(Math.PI / 2, 0, 0); // Rotate 90° around X to point forward
        break;
      case 'z':
        correction.set(-Math.PI / 2, 0, 0); // Just rotate -90° around X to point head forward
        break;
      case '-z':
        correction.set(-Math.PI / 2, Math.PI, 0); // Rotate -90° around X for head + 180° around Y for direction
        break;
    }

    // Apply the correction
    const correctionQuaternion = new THREE.Quaternion().setFromEuler(correction);
    const finalQuaternion = tempObject.quaternion.clone().multiply(correctionQuaternion);

    if (this.smoothRotation) {
      // Smoothly interpolate to the target rotation
      this.targetQuaternion.copy(finalQuaternion);
      this.mesh.quaternion.slerp(this.targetQuaternion, this.rotationSpeed);
    } else {
      // Apply rotation immediately
      this.mesh.quaternion.copy(finalQuaternion);
    }
  }

  move() {
    if (this.path.length < 2 || !this.mesh) {
      return;
    }

    const currentTarget = this.path[this.currentPointIndex];
    if (!currentTarget) return;

    const currentPosition = this.position();

    // Calculate movement
    const direction = currentTarget.clone().sub(currentPosition);
    const distanceToTarget = direction.length();

    if (distanceToTarget > 0) {
      // Normalize direction and apply speed
      direction.normalize().multiplyScalar(this.speed);

      // Move towards target
      this.mesh.position.add(direction);

      // For birds flying backwards, orient them 180 degrees from their movement direction
      const behindPosition = currentPosition
        .clone()
        .sub(direction.clone().normalize().multiplyScalar(10));
      this.orientTowardsTarget(behindPosition);
    }

    // Check if we've reached the current target
    if (distanceToTarget < this.arrivalThreshold) {
      if (this.currentPointIndex < this.path.length - 1) {
        this.currentPointIndex++;
      } else {
        // Loop back to start
        this.currentPointIndex = 0;
      }
    }
  }

  // Get the next target position for lookahead
  getNextTarget(): THREE.Vector3 | null {
    if (this.path.length === 0 || !this.path[this.currentPointIndex]) return null;
    return this.path[this.currentPointIndex]!.clone();
  }

  // Get progress along the current path (0-1)
  getPathProgress(): number {
    if (this.path.length <= 1) return 0;
    return this.currentPointIndex / (this.path.length - 1);
  }

  // Reset to start of path
  resetPath() {
    this.currentPointIndex = 0;
    if (this.path.length > 0 && this.mesh && this.path[0]) {
      this.mesh.position.copy(this.path[0]);
    }
  }

  // Update path while maintaining current progress
  updatePath(newPath: THREE.Vector3[]) {
    const currentProgress = this.getPathProgress();
    this.path = newPath;
    if (newPath.length > 0) {
      this.currentPointIndex = Math.floor(currentProgress * (newPath.length - 1));
    }
  }
}

export default AutoFlier;
