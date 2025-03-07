import * as THREE from 'three';
import { LocationMetadata } from '../index';
import { gpsToWorld } from '../../helpers/gps';

// Real GPS coordinates for Macher
const gpsCoordinates = {
  latitude: 28.95311609534798,
  longitude: -13.711930867808482,
  altitude: 300
};

const metadata: LocationMetadata = {
  id: 'macher',
  title: 'Macher',
  description: 'Macher is a small town in the south of Lanzarote with nearby volcanic flying sites.',
  gps: gpsCoordinates,
  position: gpsToWorld(gpsCoordinates.latitude, gpsCoordinates.longitude, gpsCoordinates.altitude),
  cameraView: {
    position: new THREE.Vector3(0.2, 0.3, -0.5),
    distance: 10000
  }
};

export default metadata; 