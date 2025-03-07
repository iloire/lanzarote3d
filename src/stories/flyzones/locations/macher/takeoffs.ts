import * as THREE from 'three';
import { Takeoff } from '../index';
import { gpsToWorld } from '../../helpers/gps';

// Define GPS coordinates for Macher takeoff
const takeoffGPS = {
  id: 'macher-volcano',
  title: 'Macher Volcano',
  description: 'A volcanic cone offering unique flying experiences with strong thermals.',
  gps: {
    latitude: 28.9510,
    longitude: -13.6810,
    altitude: 300
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
          ideal: 180,
          range: [150, 210]
        },
        speed: {
          min: 10,
          max: 22,
          ideal: 15
        },
        rating: 3,
        description: 'Moderate conditions with S wind'
      }
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/macher-takeoff.jpg',
        title: 'Macher Volcano Takeoff'
      }
    ]
  }
];

export default takeoffs; 