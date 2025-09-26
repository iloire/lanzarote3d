import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CameraController } from '../../foundation/systems/scene/CameraController';
import { Sky } from '../../foundation/components/environment';
import { Island } from '../../foundation/components/scenery/Island';
import { GUI } from 'lil-gui';
import { Theme } from '../../foundation/types/Theme';

export interface StoryOptions {
  camera: CameraController;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  terrain: THREE.Mesh;
  terrainInstance?: Island; // Optional Island instance for theme application
  water: THREE.Mesh;
  sky: Sky;
  gui: GUI;
  controls: OrbitControls;
  theme?: Theme; // Optional theme parameter
  environment?: any; // Optional Environment instance for theme application
}
