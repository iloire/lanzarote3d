import * as THREE from "three";
import Paraglider from "../components/base/flier";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Animations from "../utils/animations";
import Controls from "../utils/controls";
import GuiHelper from "../utils/gui";

const DEFAULT_FOLLOW_DISTANCE = 180;
const DEFAULT_ANGLE = -Math.PI / 5.8;
const DEFAULT_ANGLE_Y = Math.PI / 0.4;

export enum CameraMode {
  FirstPersonView = 1,
  FollowTarget = 2,
  OrbitControl = 6,
}

let isLeftViewing = false;
let isRightViewing = false;
let isUpViewing = false;
let isDownViewing = false;
let isZoomInViewing = false;
let isZoomOutViewing = false;

document.addEventListener("keydown", onDocumentKeyDown, false);
document.addEventListener("keyup", onDocumentKeyUp, false);

enum KeyCodes {
  left = 37, // left arrow
  right = 39, //right arrow
  up = 38, // up arrow
  down = 40, // down arrow
  in = 33, // page up
  out = 34, // page down
}

function onDocumentKeyDown(event) {
  const keyCode = event.which;
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

function onDocumentKeyUp(event) {
  const keyCode = event.which;
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

class Camera extends THREE.PerspectiveCamera {
  mode: CameraMode;
  target: Paraglider;
  terrain: THREE.Mesh;
  angle: number = DEFAULT_ANGLE;
  angleY: number = DEFAULT_ANGLE_Y;
  distance: number = DEFAULT_FOLLOW_DISTANCE;
  angleIncrement: number = 0.02;
  distanceIncrement: number = 0.9;
  firstPersonViewOffset: THREE.Vector3 = new THREE.Vector3(0, 0.1, 0);
  directionToLook: THREE.Vector3;
  viewRotationHorizontal: number = 0;
  viewRotationVertical: number = 0;

  constructor(
    fov: number,
    aspect: number,
    near: number,
    far: number,
    renderer: THREE.WebGLRenderer,
    terrain: THREE.Mesh
  ) {
    super(fov, aspect, near, far);
    this.terrain = terrain;
  }

  addGui(gui) {
    GuiHelper.addLocationGui(gui, "Camera", this, { min: 0, max: 10000 });
    GuiHelper.addPositionGui(
      gui,
      "Camera.firstPersonViewOffset",
      this.firstPersonViewOffset,
      {
        min: -20,
        max: 20,
      }
    );
    const g = gui.addFolder("Camera.followTarget");
    g.add(this, "angle", -Math.PI, Math.PI).name("angle").listen();
  }

  update() {
    if (!this.mode) {
      return;
    }
    if (this.mode === CameraMode.FollowTarget) {
      this.followTarget();
    } else if (this.mode === CameraMode.FirstPersonView) {
      this.firstPersonView();
    } else {
      throw new Error("invalid camera mode");
    }

    isLeftViewing && this.turnLeft();
    isRightViewing && this.turnRight();
    isUpViewing && this.lookUp();
    isDownViewing && this.lookDown();
    isZoomInViewing && this.zoomIn();
    isZoomOutViewing && this.zoomOut();
  }

  setCameraMode(mode: CameraMode, target: Paraglider) {
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
    cb: any = () => { }
  ) {
    Animations.animateCamera(
      this,
      controls,
      newPosition,
      newTarget,
      duration,
      cb
    );
  }

  followTarget() {
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
    const cam = this;
    const pg = this.target;

    cam.position.copy(pg.position()).add(this.firstPersonViewOffset);

    const lookAt = pg.position().add(pg.direction().multiplyScalar(20000));
    this.lookAt(lookAt);

    // adjust for roll
    this.rotateZ(
      -1 * (this.viewRotationHorizontal / 4 + pg.getMesh().rotation.z)
    );

    // view rotation
    this.rotateY(-1 * this.viewRotationHorizontal * 1.5);
    this.rotateX(-1 * this.viewRotationVertical * 1.5);
  }
}

export default Camera;
