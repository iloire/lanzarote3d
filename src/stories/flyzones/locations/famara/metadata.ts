import * as THREE from 'three';
import { LocationMetadata } from '../index';
import { gpsToWorld } from '../../helpers/gps';


const gpsCoordinates = {
  latitude: 29.1187513,
  longitude: -13.5654236,
  altitude: 30
};

const metadata: LocationMetadata = {
  id: 'famara',
  title: 'Famara',
  description: 'Famara is a beautiful beach on the northwest coast of Lanzarote, known for its stunning cliffs and excellent paragliding conditions.',
  // Define position using GPS coordinates
  gps:  gpsCoordinates,
  // The position is automatically calculated from GPS
  position: gpsToWorld(gpsCoordinates.latitude, gpsCoordinates.longitude, gpsCoordinates.altitude),
  cameraView: {
    position: new THREE.Vector3(-0.5, 0.3, 0.1),
    distance: 5000
  }
};

export default metadata; 