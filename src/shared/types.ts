import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CameraController } from '../foundation/systems/scene/CameraController';
import { Sky } from '../foundation/components/environment';
import { Island } from '../foundation/components/scenery/Island';
import { GUI } from 'lil-gui';
import { Theme } from '../foundation/types/Theme';
import Environment from './env/environment';

export interface StoryOptions {
  camera: THREE.PerspectiveCamera; // Changed from CameraController to base class for flexibility
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  gui: GUI;
  controls: OrbitControls;

  // Environment components - loaded by base classes as needed
  terrain?: THREE.Mesh;
  terrainInstance?: Island; // Optional Island instance for theme application
  water?: THREE.Mesh;
  sky?: Sky;

  // Optional parameters
  theme?: Theme; // Optional theme parameter
  environment?: Environment; // Optional Environment instance for theme application
}
