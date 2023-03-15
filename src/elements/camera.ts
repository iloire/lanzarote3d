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
  FirstPersonView = "FPV",
  FollowTarget = "FOLLOW",
  FollowTargetBehind = "FOLLOWBEHIND",
  FarAway = "FAR",
  TopView = "TOP",
  AirplaneView = "AIRPLANE",
  OrbitControl = "ORBIT",
}

class Camera extends THREE.PerspectiveCamera {
  mode: CameraMode;
  target: Paraglider;
  terrain: THREE.Mesh;
  controls: OrbitControls;
  angle: number = 0;
  angleIncrement: number = 0.05;
  distance: number = 20;
  distanceIncrement: number = 2;
  farAwayOffset: THREE.Vector3 = new THREE.Vector3(-1302, 700, 1301.2);
  topViewOffset: THREE.Vector3 = new THREE.Vector3(10, 300, -10);
  airplaneViewOffset: THREE.Vector3 = new THREE.Vector3(-6030, 2000, -11330);
  directionToLook: THREE.Vector3;
  viewRotationX: number = 0;
  viewRotationY: number = 0;

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
    GuiHelper.addLocationGui(gui, "camera", this);
  }

  update() {
    if (!this.mode) {
      return;
    }
    const raycaster = new THREE.Raycaster(
      this.target.position(),
      this.position.clone().sub(this.target.position()).normalize()
    );
    const intersects = raycaster.intersectObject(this.terrain);
    if (intersects.length > 0) {
      // console.log("camera intersects", intersects);
      const distance = intersects[0].distance;
      // console.log(distance);
      const newPosition = new THREE.Vector3().addVectors(
        this.position,
        raycaster.ray.direction.multiplyScalar(distance)
      );
      // this.position.copy(newPosition);
    }
    if (this.mode === CameraMode.FollowTarget) {
      this.followTarget();
    } else if (this.mode === CameraMode.FollowTargetBehind) {
      this.followTargetBehind();
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
    this.viewRotationX = angleRadiansX;
    this.viewRotationY = angleRadiansY;
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

  followTargetBehind() {
    const cameraoffset = new THREE.Vector3(3, 1, 3);
    this.position.copy(
      this.target
        .position()
        .add(this.target.direction().add(cameraoffset).multiplyScalar(10))
    );
    this.lookAt(
      this.target.position().add(this.target.direction().multiplyScalar(20))
    );
    // adjust for roll
    // this.rotateZ(this.viewRotationX / 4 + this.target.model.rotation.z);

    // view rotation
    // this.rotateY(this.viewRotationX * 1.5);
  }

  firstPersonView() {
    const cameraoffset = new THREE.Vector3(0, 3, 0);
    this.position.copy(
      this.target
        .position()
        .add(this.target.direction().add(cameraoffset).multiplyScalar(-0.8))
    );
    this.lookAt(
      this.target.position().add(this.target.direction().multiplyScalar(20))
    );
    // adjust for roll
    this.rotateZ(-1 * (this.viewRotationX / 4 + this.target.model.rotation.z));

    // view rotation
    this.rotateY(-1 * this.viewRotationX * 1.5);
    this.rotateX(-1 * this.viewRotationY * 1.5);
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
