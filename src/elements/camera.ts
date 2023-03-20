import * as THREE from "three";
import Paraglider from "./pg";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Animations from "../utils/animations";
import Controls from "../utils/controls";
import GuiHelper from "../utils/gui";

const getObjectPosition = (obj: THREE.Object3D) => {
  const pos = new THREE.Vector3();
  obj.getWorldPosition(pos);
  return pos;
};

export enum CameraMode {
  FirstPersonView = 1,
  FollowTarget = 2,
  FarAway = 3,
  TopView = 4,
  AirplaneView = 5,
  OrbitControl = 6,
}

class Camera extends THREE.PerspectiveCamera {
  mode: CameraMode;
  target: Paraglider;
  terrain: THREE.Mesh;
  controls: OrbitControls;
  angle: number = 0;
  angleIncrement: number = 0.05;
  distance: number = 200;
  distanceIncrement: number = 20;
  farAwayOffset: THREE.Vector3 = new THREE.Vector3(-1302, 700, 1301.2);
  topViewOffset: THREE.Vector3 = new THREE.Vector3(30, 3700, -40);
  airplaneViewOffset: THREE.Vector3 = new THREE.Vector3(-6030, 2000, -11330);
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
    this.controls = Controls.createControls(this, renderer);
  }

  addGui(gui) {
    GuiHelper.addLocationGui(gui, "camera", this, { min: 0, max: 10000 });
  }

  update() {
    if (!this.mode) {
      return;
    }
    if (this.mode === CameraMode.FollowTarget) {
      this.followTarget();
    } else if (this.mode === CameraMode.FirstPersonView) {
      this.firstPersonView();
    } else if (this.mode === CameraMode.FarAway) {
      this.farAwayView();
    } else if (this.mode === CameraMode.TopView) {
      this.topView();
    } else if (this.mode === CameraMode.AirplaneView) {
      this.airplaneView();
    } else if (this.mode === CameraMode.OrbitControl) {
      this.orbitView();
    } else {
      throw new Error("invalid camera mode");
    }
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
    cb: any = () => {}
  ) {
    Animations.animateCamera(
      this,
      this.controls,
      newPosition,
      newTarget,
      duration,
      cb
    );
  }

  followTarget() {
    const x = Math.sin(this.angle) * this.distance;
    const z = Math.cos(this.angle) * this.distance;
    const pg = this.target;
    const cameraOffset = new THREE.Vector3(x, 40, 60 + z);
    this.position.copy(pg.position().add(pg.direction().add(cameraOffset)));

    const lookOffset = new THREE.Vector3(0, 0, 0);
    const lookAt = pg.position().add(pg.direction().add(lookOffset));
    this.lookAt(lookAt);
  }

  firstPersonView() {
    // const cameraOffset = new THREE.Vector3(-40, 0, 0);
    const cam = this;
    const pg = this.target;

    cam.position.copy(pg.position());

    // const lookOffset = new THREE.Vector3(0, -70, 2);
    const lookAt = pg.position().add(pg.direction().multiplyScalar(20000));
    this.lookAt(lookAt);

    // adjust for roll
    this.rotateZ(
      -1 * (this.viewRotationHorizontal / 4 + this.target.model.rotation.z)
    );

    // view rotation
    this.rotateY(-1 * this.viewRotationHorizontal * 1.5);
    this.rotateX(-1 * this.viewRotationVertical * 1.5);
  }

  farAwayView() {
    this.viewWithOffset(this.farAwayOffset);
  }

  topView() {
    this.viewWithOffset(this.topViewOffset);
  }

  airplaneView() {
    this.viewWithOffset(this.airplaneViewOffset);
  }

  orbitView() {
    this.controls.target = this.target.position();
    this.controls.update();
  }

  private viewWithOffset(offset: THREE.Vector3) {
    this.position.copy(this.target.position()).add(offset);
    this.lookAt(this.target.position());
  }
}

export default Camera;
