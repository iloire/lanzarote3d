import * as THREE from 'three';
import { LandingSpot } from '../index';
import { gpsToWorld } from '../../helpers/gps';

// Define GPS coordinates for each landing spot
const landingGPS = [
  {
    id: 'macher-field',
    title: 'Macher Field',
    description: 'A flat field near the town with good access.',
    gps: {
      latitude: 28.9515,
      longitude: -13.6805,
      altitude: 15
    },
    type: 'primary' as const
  },
  {
    id: 'macher-beach',
    title: 'Macher Beach',
    description: 'A small beach landing for emergency use only.',
    gps: {
      latitude: 28.9520,
      longitude: -13.6800,
      altitude: 5
    },
    type: 'emergency' as const
  }
];

const landingSpots: LandingSpot[] = landingGPS.map(l => ({
  id: l.id,
  title: l.title,
  description: l.description,
  gps: l.gps,
  position: gpsToWorld(l.gps.latitude, l.gps.longitude, l.gps.altitude),
  elevation: l.gps.altitude,
  type: l.type,
  mediaItems: [
    {
      type: 'image',
      url: `/assets/images/${l.id}.jpg`,
      title: `${l.title}`
    }
  ]
}));

export default landingSpots; 