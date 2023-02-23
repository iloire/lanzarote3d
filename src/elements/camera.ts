import * as THREE from "three";

const getObjectPosition = (obj: THREE.Object3D) => {
  const pos = new THREE.Vector3();
  obj.getWorldPosition(pos);
  return pos;
};

export enum CameraMode {
  FollowTarget = "FOLLOW",
  FirstPersonView = "FPV",
  FarAway = "FAR",
}

class Camera extends THREE.PerspectiveCamera {
  mode: CameraMode;
  target: THREE.Mesh;

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
      this.followTarget(this.target);
    } else if (this.mode === CameraMode.FirstPersonView) {
      this.firstPersonView(this.target);
    } else if (this.mode === CameraMode.FarAway) {
      this.farAwayView(this.target);
    } else {
      throw new Error("invalid camera mode");
    }
  }

  setCameraMode(mode: CameraMode, target: THREE.Mesh) {
    this.target = target;
    this.mode = mode;
    this.update();
  }

  followTarget = (target: THREE.Mesh) => {
    const cameraoffset = new THREE.Vector3(-41.2, 9, 41.2);
    this.position.copy(getObjectPosition(target)).add(cameraoffset);
  };

  firstPersonView(target: THREE.Mesh) {
    this.position.copy(getObjectPosition(target));
  }

  farAwayView(target: THREE.Mesh) {
    const cameraoffset = new THREE.Vector3(-402, 1000, 101.2);
    this.position.copy(getObjectPosition(target)).add(cameraoffset);
  }
}

export default Camera;
