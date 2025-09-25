import * as THREE from "three";

export default interface IFlyable {
  left: () => void;
  leftRelease: () => void;
  right: () => void;
  rightRelease: () => void;
  getMesh: () => THREE.Object3D;
}
