import * as THREE from 'three';
import { LocationMetadata } from '../index';
import { gpsToWorld } from '../../helpers/gps';

// Real GPS coordinates for Teguise
const gpsCoordinates = {
  latitude: 29.065069885458016,
  longitude: -13.576339149327737,
  altitude: 20
};

const metadata: LocationMetadata = {
  id: 'teguise',
  title: 'Teguise',
  description: 'Historic town in the center of Lanzarote with nearby flying sites.',
  gps: gpsCoordinates,
  position: gpsToWorld(gpsCoordinates.latitude, gpsCoordinates.longitude, gpsCoordinates.altitude),
  cameraView: {
    position: new THREE.Vector3(-0.5, 0.3, 0.5),
    distance: 10000
  }
};

export default metadata;