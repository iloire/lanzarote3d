import * as THREE from 'three';
import { Takeoff } from '../index';
import { gpsToWorld } from '../../helpers/gps';

// Define GPS coordinates for Teguise takeoff
const takeoffGPS = {
  id: 'teguise-hill',
  title: 'Teguise Hill',
  description: 'A smooth hill takeoff with good thermal development in the afternoons.',
  gps: {
    latitude: 29.0660,
    longitude: -13.5160,
    altitude: 400
  }
};

const takeoffs: Takeoff[] = [
  {
    id: takeoffGPS.id,
    title: takeoffGPS.title,
    description: takeoffGPS.description,
    gps: takeoffGPS.gps,
    position: gpsToWorld(takeoffGPS.gps.latitude, takeoffGPS.gps.longitude, takeoffGPS.gps.altitude),
    elevation: takeoffGPS.gps.altitude,
    conditions: [
      {
        direction: {
          ideal: 90,
          range: [60, 120]
        },
        speed: {
          min: 8,
          max: 20,
          ideal: 12
        },
        rating: 4,
        description: 'Good conditions with E wind'
      }
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/teguise-takeoff.jpg',
        title: 'Teguise Hill Takeoff'
      }
    ]
  }
];

export default takeoffs; 