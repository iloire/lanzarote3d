import * as THREE from 'three';
import Flier from '../../types/flier';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { animator } from '../animation/SimpleAnimator';
import GuiHelper from '../../utils/gui';

const DEFAULT_FOLLOW_DISTANCE = 180;
const DEFAULT_ANGLE = -Math.PI / 5.8;
const DEFAULT_ANGLE_Y = Math.PI / 0.4;

export enum CameraMode {
  FirstPersonView = 1,
  FollowTarget = 2,
}

let isLeftViewing = false;
let isRightViewing = false;
let isUpViewing = false;
let isDownViewing = false;
let isZoomInViewing = false;
let isZoomOutViewing = false;

// Event listeners will be added when controller is initialized
let keydownListener: ((event: KeyboardEvent) => void) | null = null;
let keyupListener: ((event: KeyboardEvent) => void) | null = null;

enum KeyCodes {
  left = 37, // left arrow
  right = 39, //right arrow
  up = 38, // up arrow
  down = 40, // down arrow
  in = 33, // page up
  out = 34, // page down
}

function onDocumentKeyDown(event: KeyboardEvent) {
  const keyCode = event.keyCode || event.which; // Fallback for compatibility
  if (keyCode === KeyCodes.left) {
    isLeftViewing = true;
  } else if (keyCode === KeyCodes.right) {
    isRightViewing = true;
  } else if (keyCode === KeyCodes.out) {
    isZoomOutViewing = true;
  } else if (keyCode === KeyCodes.in) {
    isZoomInViewing = true;
  } else if (keyCode === KeyCodes.up) {
    isUpViewing = true;
  } else if (keyCode === KeyCodes.down) {
    isDownViewing = true;
  }
}

function onDocumentKeyUp(event: KeyboardEvent) {
  const keyCode = event.keyCode || event.which; // Fallback for compatibility
  if (keyCode === KeyCodes.left) {
    isLeftViewing = false;
  } else if (keyCode === KeyCodes.right) {
    isRightViewing = false;
  } else if (keyCode === KeyCodes.out) {
    isZoomOutViewing = false;
  } else if (keyCode === KeyCodes.in) {
    isZoomInViewing = false;
  } else if (keyCode === KeyCodes.up) {
    isUpViewing = false;
  } else if (keyCode === KeyCodes.down) {
    isDownViewing = false;
  }
}

export class CameraController extends THREE.PerspectiveCamera {
  mode: CameraMode = CameraMode.FollowTarget;
  target!: Flier;
  angle: number = DEFAULT_ANGLE;
  angleY: number = DEFAULT_ANGLE_Y;
  distance: number = DEFAULT_FOLLOW_DISTANCE;
  angleIncrement: number = 0.02;
  distanceIncrement: number = 0.9;
  firstPersonViewOffset: THREE.Vector3 = new THREE.Vector3(0, 0.1, 0);
  directionToLook: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  viewRotationHorizontal: number = 0;
  viewRotationVertical: number = 0;
  floatStartTime = performance.now();
  baseY: number = 0;

  constructor(fov: number, aspect: number, near: number, far: number) {
    super(fov, aspect, near, far);
  }

  addGui(gui: any) {
    GuiHelper.addLocationGui(gui, 'Camera', this, { min: 0, max: 10000 });
    GuiHelper.addPositionGui(gui, 'Camera.firstPersonViewOffset', this.firstPersonViewOffset, {
      min: -20,
      max: 20,
    });
    const g = gui.addFolder('Camera.followTarget');
    g.add(this, 'angle', -Math.PI, Math.PI).name('angle').listen();
  }

  update() {
    if (!this.mode) {
      return;
    }
    if (this.mode === CameraMode.FollowTarget) {
      // Camera switching to follow target mode
      if (!this.target) {
        throw new Error('Camera target is not set');
      }
      this.followTarget();
    } else if (this.mode === CameraMode.FirstPersonView) {
      // Camera switching to first person mode
      if (!this.target) {
        throw new Error('Camera target is not set');
      }
      this.firstPersonView();
    } else {
      throw new Error('invalid camera mode');
    }

    isLeftViewing && this.turnLeft();
    isRightViewing && this.turnRight();
    isUpViewing && this.lookUp();
    isDownViewing && this.lookDown();
    isZoomInViewing && this.zoomIn();
    isZoomOutViewing && this.zoomOut();
  }

  setCameraMode(mode: CameraMode, target: Flier) {
    this.target = target;
    this.mode = mode;
  }

  turnLeft() {
    this.angle -= this.angleIncrement;
  }

  turnRight() {
    this.angle += this.angleIncrement;
  }

  lookUp() {
    this.angleY -= this.angleIncrement;
  }

  lookDown() {
    this.angleY += this.angleIncrement;
  }

  zoomIn() {
    this.distance -= this.distanceIncrement;
  }

  zoomOut() {
    this.distance += this.distanceIncrement;
  }

  lookDirection(xDegrees: number, yDegrees: number) {
    // Camera look direction updated
    const angleRadiansX = THREE.MathUtils.degToRad(xDegrees);
    const angleRadiansY = THREE.MathUtils.degToRad(yDegrees);
    this.viewRotationHorizontal = angleRadiansX;
    this.viewRotationVertical = angleRadiansY;
  }

  animateTo(
    newPosition: THREE.Vector3,
    newTarget: THREE.Vector3,
    duration: number = 2000,
    controls: OrbitControls,
    cb: any = () => {}
  ) {
    // Store initial positions
    const startPosition = this.position.clone();
    const startTarget = controls.target.clone();

    // Simple animation using our SimpleAnimator
    animator.animate(
      `camera-${Date.now()}`,
      duration,
      progress => {
        // Interpolate camera position
        this.position.lerpVectors(startPosition, newPosition, progress);

        // Interpolate look target
        controls.target.lerpVectors(startTarget, newTarget, progress);
        controls.update();
      },
      cb
    );
  }

  followTarget() {
    // Camera following target
    const x = Math.sin(this.angle) * this.distance;
    const z = Math.cos(this.angle) * this.distance;
    const y = Math.cos(this.angleY) * this.distance;

    const pg = this.target;
    const cameraOffset = new THREE.Vector3(x, y, z);
    this.position.copy(pg.position().add(pg.direction().add(cameraOffset)));

    const lookOffset = new THREE.Vector3(0, 0, 0);
    const lookAt = pg.position().add(pg.direction().add(lookOffset));
    this.lookAt(lookAt);
  }

  firstPersonView() {
    // Camera in first person view
    const cam = this;
    const pg = this.target;

    cam.position.copy(pg.position()).add(this.firstPersonViewOffset);

    const lookAt = pg.position().add(pg.direction().multiplyScalar(20000));
    this.lookAt(lookAt);

    // adjust for roll
    this.rotateZ(-1 * (this.viewRotationHorizontal / 4 + pg.getMesh().rotation.z));

    // view rotation
    this.rotateY(-1 * this.viewRotationHorizontal * 1.5);
    this.rotateX(-1 * this.viewRotationVertical * 1.5);
  }

  dispose() {
    // Clean up event listeners
    if (keydownListener) {
      document.removeEventListener('keydown', keydownListener);
      keydownListener = null;
    }
    if (keyupListener) {
      document.removeEventListener('keyup', keyupListener);
      keyupListener = null;
    }
  }

  // Static method to initialize event listeners
  static initializeEventListeners() {
    if (!keydownListener) {
      keydownListener = onDocumentKeyDown;
      document.addEventListener('keydown', keydownListener, false);
    }
    if (!keyupListener) {
      keyupListener = onDocumentKeyUp;
      document.addEventListener('keyup', keyupListener, false);
    }
  }
}

// Backward compatibility export
export default CameraController;

// Re-export for foundation API
export { CameraController as Camera };
