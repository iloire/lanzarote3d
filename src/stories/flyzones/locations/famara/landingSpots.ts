import * as THREE from 'three';
import { LandingSpot } from '../index';
import { gpsToWorld } from '../../helpers/gps';

// Define GPS coordinates for each landing spot
const landingGPS = [
  {
    id: 'landing-famara-beach',
    title: 'Famara Beach Landing',
    description: 'Wide beach landing area with consistent sea breeze.',
    gps: {
      latitude: 29.1180,
      longitude: -13.5630,
      altitude: 5
    },
    type: 'primary' as const
  },
  {
    id: 'landing-famara-field',
    title: 'Famara Field Landing',
    description: 'Large open field near the town with easy access.',
    gps: {
      latitude: 29.1160,
      longitude: -13.5620,
      altitude: 15
    },
    type: 'primary' as const
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
      url: '/assets/images/landing.jpg',
      title: 'Landing Area'
    }
  ]
}));

export default landingSpots;
