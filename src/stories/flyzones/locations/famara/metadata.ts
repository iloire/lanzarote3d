import * as THREE from 'three';
import { LocationMetadata } from '../index';

const metadata: LocationMetadata = {
  id: 'famara',
  title: 'Famara',
  description: 'Famara is a beautiful beach on the northwest coast of Lanzarote, known for its stunning cliffs and excellent paragliding conditions.',
  position: new THREE.Vector3(0, 0, 0),
  cameraView: {
    position: new THREE.Vector3(-0.5, 0.3, 0.5),
    distance: 15000
  }
};

export default metadata; 