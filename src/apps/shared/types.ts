import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Camera from '../foundation/systems/scene/CameraController';
import Sky from '../foundation/components/environment/Sky';
import { GUI } from 'lil-gui';
import { Theme } from '../../foundation/types/Theme';

export interface StoryOptions {
  camera: Camera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  terrain: THREE.Mesh;
  water: THREE.Mesh;
  sky: Sky;
  gui: GUI;
  controls: OrbitControls;
  theme?: Theme; // Optional theme parameter
}
