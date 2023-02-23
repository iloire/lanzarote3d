import * as THREE from "three";

const getObjectPosition = (obj: THREE.Object3D) => {
  const pos = new THREE.Vector3();
  obj.getWorldPosition(pos);
  return pos;
};

class Camera extends THREE.PerspectiveCamera {
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

  followTarget(target: THREE.Mesh, offset?: THREE.Vector3) {
    const cameraOffset = offset || new THREE.Vector3(-4.2, 10, 11.2);
    this.position.copy(getObjectPosition(target)).add(cameraOffset);
  }

  firstPersonView(target: THREE.Mesh) {
    this.position.copy(getObjectPosition(target));
  }
}

export default Camera;
