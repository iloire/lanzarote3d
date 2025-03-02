import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Camera from "../components/camera";
import Sky from "../components/sky";
import { GUI } from "lil-gui";

export interface StoryOptions {
  camera: Camera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  terrain: THREE.Mesh;
  water: THREE.Mesh;
  sky: Sky;
  gui: GUI;
  controls: OrbitControls;
} 