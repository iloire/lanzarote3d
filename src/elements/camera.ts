import * as THREE from "three";
import Paraglider from "./pg";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Animations from "../utils/animations";

const getObjectPosition = (obj: THREE.Object3D) => {
  const pos = new THREE.Vector3();
  obj.getWorldPosition(pos);
  return pos;
};

export enum CameraMode {
  FollowTarget = "FOLLOW",
  FirstPersonView = "FPV",
  FarAway = "FAR",
  TopView = "TOP",
  AirplaneView = "AIRPLANE",
  OrbitControl = "ORBIT",
}

class Camera extends THREE.PerspectiveCamera {
  mode: CameraMode;
  target: Paraglider;
  controls: OrbitControls;
  angle: number = 0;
  angleIncrement: number = 0.05;
  distance: number = 20;
  distanceIncrement: number = 2;
  farAwayOffset: THREE.Vector3 = new THREE.Vector3(-1302, 700, 1301.2);
  topViewOffset: THREE.Vector3 = new THREE.Vector3(10, 300, -10);
  airplaneViewOffset: THREE.Vector3 = new THREE.Vector3(-6030, 2000, -11330);
  directionToLook: THREE.Vector3;

  addGui(gui) {
    const cameraGui = gui.addFolder("Camera");
    cameraGui.add(this.position, "x", -1000, 1000).name("x").listen();
    cameraGui.add(this.position, "y", 200, 2000).name("y").listen();
    cameraGui.add(this.position, "z", -1000, 1000).name("z").listen();

    cameraGui
      .add(this.rotation, "x", -Math.PI, Math.PI)
      .name("rotation.x")
      .listen();
    cameraGui
      .add(this.rotation, "y", -Math.PI, Math.PI)
      .name("rotation.y")
      .listen();
    cameraGui
      .add(this.rotation, "z", -Math.PI, Math.PI)
      .name("rotation.z")
      .listen();
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

  setCameraMode(mode: CameraMode, target: Paraglider, controls: OrbitControls) {
    this.target = target;
    this.mode = mode;
    this.controls = controls;
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
    const x = this.target.position().x + Math.sin(this.angle) * this.distance;
    const z = this.target.position().z + Math.cos(this.angle) * this.distance;
    this.position.set(x, this.target.position().y, z);
    this.lookAt(this.target.position());
  }

  firstPersonView() {
    const cameraoffset = new THREE.Vector3(0, -1.1, 0);
    this.position.copy(
      this.target
        .position()
        .add(this.target.direction().add(cameraoffset).multiplyScalar(-0.8))
    );
    this.lookAt(
      this.target.position().add(this.target.direction().multiplyScalar(20))
    );
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
