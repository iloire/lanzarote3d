import * as THREE from 'three';
import { LocationMetadata } from '../index';

const metadata: LocationMetadata = {
  id: 'macher',
  title: 'Macher',
  description: 'Macher is a small town in the south of Lanzarote with nearby volcanic flying sites.',
  position: new THREE.Vector3(-3000, 0, 8000),
  cameraView: {
    position: new THREE.Vector3(0.2, 0.3, -0.5),
    distance: 10000
  }
};

export default metadata; 