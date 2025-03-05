import * as THREE from 'three';
import { LocationMetadata } from '../index';

const metadata: LocationMetadata = {
  id: 'teguise',
  title: 'Teguise',
  description: 'Teguise is a historic town in the center of Lanzarote with nearby flying sites.',
  position: new THREE.Vector3(5000, 0, 5000),
  cameraView: {
    position: new THREE.Vector3(-0.3, 0.4, 0.5),
    distance: 12000
  }
};

export default metadata; 