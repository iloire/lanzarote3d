import * as THREE from "three";
import Paraglider from "./pg";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const getObjectPosition = (obj: THREE.Object3D) => {
  const pos = new THREE.Vector3();
  obj.getWorldPosition(pos);
  return pos;
};

export enum CameraMode {
  FollowTarget = "FOLLOW",
  FollowTarget2 = "FOLLOW2",
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
  follow1Offset: THREE.Vector3 = new THREE.Vector3(-31.2, 10, 21.2);
  follow2Offset: THREE.Vector3 = new THREE.Vector3(31.2, 10, -21.2);
  topViewOffset: THREE.Vector3 = new THREE.Vector3(10, 300, -10);
  airplaneViewOffset: THREE.Vector3 = new THREE.Vector3(-33030, 4000, -18330);
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
    } else if (this.mode === CameraMode.FollowTarget2) {
      this.followTarget2();
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
    this.directionToLook = target.direction().multiplyScalar(10);
    this.update();
  }

  turnLeft() {
    const left = new THREE.Vector3(0, 0, 1);
    this.rotateY((Math.PI / 180) * 5);
    this.follow1Offset.add(left);
    this.follow2Offset.add(left);
    this.topViewOffset.add(left);
    this.directionToLook.add(left.multiplyScalar(10));
  }

  turnRight() {
    const right = new THREE.Vector3(0, 0, -1);
    this.rotateY((-Math.PI / 180) * 5);
    this.follow1Offset.add(right);
    this.follow2Offset.add(right);
    this.topViewOffset.add(right);
    this.directionToLook.add(right.multiplyScalar(10));
  }

  followTarget() {
    const cameraoffset = this.follow1Offset;
    this.position
      .copy(getObjectPosition(this.target.getMesh()))
      .add(cameraoffset);
    this.lookAt(this.target.position());
  }

  followTarget2() {
    const cameraoffset = this.follow2Offset;
    this.position
      .copy(getObjectPosition(this.target.getMesh()))
      .add(cameraoffset);
    this.lookAt(this.target.position());
  }

  firstPersonView() {
    const posPg = getObjectPosition(this.target.getMesh()).clone();
    const cameraoffset = new THREE.Vector3(0, -1.1, 0);
    this.position.copy(
      posPg.add(this.target.direction().add(cameraoffset).multiplyScalar(-0.8))
    );
    this.lookAt(
      posPg.add(this.target.direction().multiplyScalar(20))
    );
  }

  farAwayView() {
    const cameraoffset = new THREE.Vector3(-1302, 700, 1301.2);
    this.position
      .copy(getObjectPosition(this.target.getMesh()))
      .add(cameraoffset);
    this.lookAt(this.target.position());
  }

  topView() {
    const cameraoffset = this.topViewOffset;
    this.position
      .copy(getObjectPosition(this.target.getMesh()))
      .add(cameraoffset);
    this.lookAt(this.target.position());
  }

  airplaneView() {
    const cameraoffset = this.airplaneViewOffset;
    this.position
      .copy(getObjectPosition(this.target.getMesh()))
      .add(cameraoffset);
    this.lookAt(this.target.position());
  }

  orbitView() {
    this.controls.target = this.target.position();
    this.controls.update();
  }
}

export default Camera;
