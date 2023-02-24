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
  OrbitControl = "ORBIT",
}

class Camera extends THREE.PerspectiveCamera {
  mode: CameraMode;
  target: Paraglider;
  controls: OrbitControls;

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
    this.update();
  }

  followTarget() {
    const cameraoffset = new THREE.Vector3(-31.2, 10, 21.2);
    this.position
      .copy(getObjectPosition(this.target.getMesh()))
      .add(cameraoffset);
    this.lookAt(this.target.position());
  }

  followTarget2() {
    const cameraoffset = new THREE.Vector3(31.2, 10, -21.2);
    this.position
      .copy(getObjectPosition(this.target.getMesh()))
      .add(cameraoffset);
    this.lookAt(this.target.position());
  }
  firstPersonView() {
    this.position.copy(getObjectPosition(this.target.getMesh()));
    const directionToLook = this.target.direction().multiplyScalar(10000);
    this.lookAt(directionToLook);
  }

  farAwayView() {
    const cameraoffset = new THREE.Vector3(-1102, 500, 1001.2);
    this.position
      .copy(getObjectPosition(this.target.getMesh()))
      .add(cameraoffset);
    this.lookAt(this.target.position());
  }

  topView() {
    const cameraoffset = new THREE.Vector3(0, 500, 0);
    this.position
      .copy(getObjectPosition(this.target.getMesh()))
      .add(cameraoffset);
    this.lookAt(this.target.position());
  }

  orbitView() {
    this.controls.target = this.target.position();
    // this.controls.update();
  }
}

export default Camera;
