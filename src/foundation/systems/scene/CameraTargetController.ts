import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { animator } from '../animation/SimpleAnimator';
import GuiHelper from '../../utils/gui';
import { GUI } from 'lil-gui';
import { logger } from '../../utils/logger';

export enum CameraMode {
  Follow = 'follow',
  FirstPerson = 'first-person',
  Orbit = 'orbit',
  Static = 'static',
}

export interface CameraTarget {
  object: THREE.Object3D;
  name: string;
  metadata?: Record<string, unknown>;
}

interface CameraSettings {
  follow: {
    distance: number;
    height: number;
    angle: number;
  };
  firstPerson: {
    offset: THREE.Vector3;
  };
  orbit: {
    distance: number;
    minDistance: number;
    maxDistance: number;
  };
}

/**
 * CameraTargetController - Modern camera controller with multi-target support
 *
 * Replaces the legacy CameraController with a clean, generic design:
 * - Works with any THREE.Object3D (no Flier dependency)
 * - Multi-target management with smooth transitions
 * - Four camera modes: Follow, FirstPerson, Orbit, Static
 * - React UI and lil-gui integration
 * - Simple, focused API
 */
export class CameraTargetController extends THREE.PerspectiveCamera {
  private targets: CameraTarget[] = [];
  private currentTargetIndex: number = -1;
  private currentMode: CameraMode = CameraMode.Follow;
  private settings: CameraSettings;
  private updateCallbacks: Array<() => void> = [];

  constructor(fov: number, aspect: number, near: number, far: number) {
    super(fov, aspect, near, far);

    this.settings = {
      follow: {
        distance: 150,
        height: 50,
        angle: 0,
      },
      firstPerson: {
        offset: new THREE.Vector3(0, 2, 0),
      },
      orbit: {
        distance: 100,
        minDistance: 10,
        maxDistance: 500,
      },
    };
  }

  /**
   * Add a target object that the camera can follow
   */
  addTarget(object: THREE.Object3D, name: string, metadata?: Record<string, unknown>): number {
    const index = this.targets.length;
    this.targets.push({ object, name, metadata });

    // If this is the first target, make it active
    if (this.targets.length === 1) {
      this.currentTargetIndex = 0;
    }

    return index;
  }

  /**
   * Remove a target by index
   */
  removeTarget(index: number): void {
    if (index < 0 || index >= this.targets.length) return;

    this.targets.splice(index, 1);

    // Adjust current index if needed
    if (this.currentTargetIndex >= this.targets.length) {
      this.currentTargetIndex = Math.max(0, this.targets.length - 1);
    }
  }

  /**
   * Switch to a different target with smooth transition
   */
  switchToTarget(
    index: number,
    mode?: CameraMode,
    duration: number = 1500,
    controls?: OrbitControls
  ): void {
    if (index < 0 || index >= this.targets.length) {
      logger.warn(`Invalid target index: ${index}`);
      return;
    }

    const previousIndex = this.currentTargetIndex;
    this.currentTargetIndex = index;

    if (mode) {
      this.currentMode = mode;
    }

    const target = this.targets[index];
    const newPosition = this.calculateCameraPosition(target);
    const lookAtPosition = target.object.position.clone();

    // If we have controls and it's a different target, animate smoothly
    if (controls && previousIndex !== index) {
      this.animateTo(newPosition, lookAtPosition, duration, controls);
    } else {
      // Instant switch
      this.position.copy(newPosition);
      this.lookAt(lookAtPosition);
      if (controls) {
        controls.target.copy(lookAtPosition);
        controls.update();
      }
    }
  }

  /**
   * Get current target
   */
  getCurrentTarget(): CameraTarget | null {
    if (this.currentTargetIndex >= 0 && this.currentTargetIndex < this.targets.length) {
      return this.targets[this.currentTargetIndex];
    }
    return null;
  }

  /**
   * Get all targets
   */
  getTargets(): CameraTarget[] {
    return this.targets;
  }

  /**
   * Get current camera mode
   */
  getMode(): CameraMode {
    return this.currentMode;
  }

  /**
   * Set camera mode
   */
  setMode(mode: CameraMode): void {
    this.currentMode = mode;
  }

  /**
   * Update camera position based on current mode and target
   * Call this in your animation loop
   */
  update(deltaTime: number = 0.016): void {
    const target = this.getCurrentTarget();
    if (!target) return;

    switch (this.currentMode) {
      case CameraMode.Follow:
        this.updateFollowMode(target, deltaTime);
        break;
      case CameraMode.FirstPerson:
        this.updateFirstPersonMode(target, deltaTime);
        break;
      case CameraMode.Orbit:
        // Orbit mode is handled by OrbitControls
        break;
      case CameraMode.Static:
        // Static mode - camera doesn't move
        break;
    }

    // Call registered update callbacks
    this.updateCallbacks.forEach(cb => cb());
  }

  /**
   * Register a callback to be called on each update
   */
  onUpdate(callback: () => void): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Update camera in follow mode
   */
  private updateFollowMode(target: CameraTarget, deltaTime: number): void {
    const targetPos = target.object.position;
    const angle = this.settings.follow.angle;

    // Calculate camera position behind and above the target
    const x = Math.sin(angle) * this.settings.follow.distance;
    const z = Math.cos(angle) * this.settings.follow.distance;
    const y = this.settings.follow.height;

    const desiredPosition = new THREE.Vector3(
      targetPos.x + x,
      targetPos.y + y,
      targetPos.z + z
    );

    // Smooth camera movement
    this.position.lerp(desiredPosition, Math.min(deltaTime * 3, 1));
    this.lookAt(targetPos);
  }

  /**
   * Update camera in first-person mode
   */
  private updateFirstPersonMode(target: CameraTarget, deltaTime: number): void {
    const targetPos = target.object.position;
    const offset = this.settings.firstPerson.offset;

    // Position camera at object position with offset
    const desiredPosition = targetPos.clone().add(offset);
    this.position.lerp(desiredPosition, Math.min(deltaTime * 5, 1));

    // Look in the direction the object is facing
    const lookAtPos = targetPos.clone();

    // If object has rotation, look in that direction
    if (target.object.quaternion) {
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(target.object.quaternion);
      lookAtPos.add(forward.multiplyScalar(100));
    }

    this.lookAt(lookAtPos);
  }

  /**
   * Calculate camera position for a target based on current mode
   */
  private calculateCameraPosition(target: CameraTarget): THREE.Vector3 {
    const targetPos = target.object.position;

    switch (this.currentMode) {
      case CameraMode.Follow: {
        const angle = this.settings.follow.angle;
        const x = Math.sin(angle) * this.settings.follow.distance;
        const z = Math.cos(angle) * this.settings.follow.distance;
        const y = this.settings.follow.height;
        return new THREE.Vector3(targetPos.x + x, targetPos.y + y, targetPos.z + z);
      }
      case CameraMode.FirstPerson: {
        return targetPos.clone().add(this.settings.firstPerson.offset);
      }
      case CameraMode.Orbit: {
        const angle = Math.PI / 4; // 45 degrees
        const x = Math.sin(angle) * this.settings.orbit.distance;
        const z = Math.cos(angle) * this.settings.orbit.distance;
        const y = this.settings.orbit.distance * 0.5;
        return new THREE.Vector3(targetPos.x + x, targetPos.y + y, targetPos.z + z);
      }
      case CameraMode.Static:
      default:
        return this.position.clone();
    }
  }

  /**
   * Smoothly animate camera to a new position and look target
   */
  animateTo(
    newPosition: THREE.Vector3,
    newTarget: THREE.Vector3,
    duration: number = 2000,
    controls?: OrbitControls,
    callback?: () => void
  ): void {
    const startPosition = this.position.clone();
    const startTarget = controls ? controls.target.clone() : newTarget.clone();

    animator.animate(
      `camera-target-${Date.now()}`,
      duration,
      progress => {
        // Interpolate camera position
        this.position.lerpVectors(startPosition, newPosition, progress);

        // Interpolate look target
        if (controls) {
          controls.target.lerpVectors(startTarget, newTarget, progress);
          controls.update();
        } else {
          const lookTarget = new THREE.Vector3().lerpVectors(startTarget, newTarget, progress);
          this.lookAt(lookTarget);
        }
      },
      callback
    );
  }

  /**
   * Add GUI controls for camera settings
   */
  addGui(gui: GUI): void {
    GuiHelper.addLocationGui(gui, 'Camera', this, { min: 0, max: 10000 });

    const cameraFolder = gui.addFolder('Camera Settings');

    // Follow mode settings
    const followFolder = cameraFolder.addFolder('Follow Mode');
    followFolder.add(this.settings.follow, 'distance', 10, 500).name('Distance');
    followFolder.add(this.settings.follow, 'height', 0, 200).name('Height');
    followFolder.add(this.settings.follow, 'angle', -Math.PI, Math.PI).name('Angle');

    // First person settings
    const fpFolder = cameraFolder.addFolder('First Person');
    GuiHelper.addPositionGui(fpFolder, 'Offset', this.settings.firstPerson.offset, {
      min: -10,
      max: 10,
    });

    // Orbit mode settings
    const orbitFolder = cameraFolder.addFolder('Orbit Mode');
    orbitFolder.add(this.settings.orbit, 'distance', 10, 500).name('Distance');
    orbitFolder.add(this.settings.orbit, 'minDistance', 1, 100).name('Min Distance');
    orbitFolder.add(this.settings.orbit, 'maxDistance', 100, 1000).name('Max Distance');

    // Target and mode selection
    if (this.targets.length > 0) {
      const targetNames = this.targets.map(t => t.name);
      cameraFolder.add({ target: this.targets[this.currentTargetIndex]?.name || '' }, 'target', targetNames)
        .name('Current Target')
        .onChange((value: string) => {
          const index = this.targets.findIndex(t => t.name === value);
          if (index >= 0) {
            this.switchToTarget(index);
          }
        });
    }

    cameraFolder.add({ mode: this.currentMode }, 'mode', Object.values(CameraMode))
      .name('Camera Mode')
      .onChange((value: string) => {
        this.setMode(value as CameraMode);
      });
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.targets = [];
    this.updateCallbacks = [];
  }
}

// Export for backward compatibility and convenience
export default CameraTargetController;
