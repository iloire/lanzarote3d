import * as THREE from 'three';
import { LandingSpot } from '../index';
import { gpsToWorld } from '../../helpers/gps';

// Define GPS coordinates for Teguise landing spot
const landingGPS = {
  id: 'teguise-field',
  title: 'Teguise Field',
  description: 'A large open field with easy access.',
  gps: {
    latitude: 29.0665,
    longitude: -13.5155,
    altitude: 20
  },
  type: 'primary' as const
};

const landingSpots: LandingSpot[] = [
  {
    id: landingGPS.id,
    title: landingGPS.title,
    description: landingGPS.description,
    gps: landingGPS.gps,
    position: gpsToWorld(landingGPS.gps.latitude, landingGPS.gps.longitude, landingGPS.gps.altitude),
    elevation: landingGPS.gps.altitude,
    type: landingGPS.type,
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/teguise-landing.jpg',
        title: 'Teguise Field Landing'
      }
    ]
  }
];

export default landingSpots; 