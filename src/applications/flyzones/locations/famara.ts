import * as THREE from 'three';
import { Location, Takeoff, LandingSpot, FlyZoneShape } from './index';
import { gpsToWorld } from '../helpers/gps';

// Famara Metadata
const metadata = {
  id: 'famara',
  title: 'Famara',
  description:
    'A stunning coastal ridge with excellent ridge soaring conditions and breathtaking views of the Atlantic Ocean.',
  position: new THREE.Vector3(0, 0, 0), // Will be calculated from takeoffs
  cameraView: {
    position: new THREE.Vector3(5000, 2000, 5000),
    lookAt: new THREE.Vector3(0, 0, 0), // Will be updated to match position
  },
};

// Famara Takeoffs
const takeoffs: Takeoff[] = [
  {
    id: 'takeoff-pechos-altos',
    title: 'Pechos bajos takeoff',
    description: 'Pechos bajos takeoff',
    gps: {
      latitude: 29.06533833716934,
      longitude: -13.57604402731929,
      altitude: 213,
    },
    position: gpsToWorld(29.06533833716934, -13.57604402731929, 213),
    elevation: 213,
    conditions: [
      {
        direction: {
          ideal: 320,
          range: [290, 350],
        },
        speed: {
          min: 10,
          max: 25,
          ideal: 15,
        },
        rating: 5,
        description: 'Perfect conditions',
      },
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/takeoff.jpg',
        title: 'Takeoff',
      },
    ],
  },
  {
    id: 'takeoff-famara-south',
    title: 'Famara South Takeoff',
    description: 'Southern takeoff point with good thermal conditions in the afternoon.',
    gps: {
      latitude: 29.1175,
      longitude: -13.565,
      altitude: 375,
    },
    position: gpsToWorld(29.1175, -13.565, 375),
    elevation: 375,
    conditions: [
      {
        direction: {
          ideal: 300,
          range: [270, 330],
        },
        speed: {
          min: 8,
          max: 20,
          ideal: 12,
        },
        rating: 4,
        description: 'Good afternoon thermal conditions',
      },
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/famara-south.jpg',
        title: 'Famara South',
      },
    ],
  },
  {
    id: 'takeoff-famara-north',
    title: 'Famara North Takeoff',
    description: 'Northern takeoff point with strong ridge lift in NW winds.',
    gps: {
      latitude: 29.121,
      longitude: -13.564,
      altitude: 847,
    },
    position: gpsToWorld(29.121, -13.564, 847),
    elevation: 847,
    conditions: [
      {
        direction: {
          ideal: 330,
          range: [300, 360],
        },
        speed: {
          min: 12,
          max: 28,
          ideal: 18,
        },
        rating: 5,
        description: 'Excellent ridge lift conditions',
      },
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/famara-north.jpg',
        title: 'Famara North',
      },
    ],
  },
];

// Famara Landing Spots
const landingSpots: LandingSpot[] = [
  {
    id: 'landing-famara-beach',
    title: 'Famara Beach Landing',
    description: 'Wide sandy beach with easy landing conditions.',
    gps: {
      latitude: 29.115,
      longitude: -13.558,
      altitude: 5,
    },
    position: gpsToWorld(29.115, -13.558, 5),
    elevation: 5,
    type: 'primary',
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/famara-beach.jpg',
        title: 'Famara Beach',
      },
    ],
  },
  {
    id: 'landing-famara-village',
    title: 'Famara Village',
    description: 'Landing area near the village, suitable in light winds.',
    gps: {
      latitude: 29.112,
      longitude: -13.556,
      altitude: 10,
    },
    position: gpsToWorld(29.112, -13.556, 10),
    elevation: 10,
    type: 'secondary',
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/famara-village.jpg',
        title: 'Famara Village',
      },
    ],
  },
];

// Famara Flyzone
const flyzone: FlyZoneShape = {
  color: 0x00ff00,
  phases: {
    takeoff: {
      type: 'takeoff',
      gps: {
        latitude: 29.1195,
        longitude: -13.5645,
        altitude: 613,
      },
      position: gpsToWorld(29.1195, -13.5645, 613),
      dimensions: {
        width: 500,
        height: 100,
        length: 500,
      },
      nextPhases: ['ridge'],
    },
    ridge: {
      type: 'ridge',
      gps: {
        latitude: 29.118,
        longitude: -13.563,
        altitude: 400,
      },
      position: gpsToWorld(29.118, -13.563, 400),
      dimensions: {
        width: 2000,
        height: 500,
        length: 500,
      },
      nextPhases: ['landing'],
    },
    landing: {
      type: 'landing',
      gps: {
        latitude: 29.115,
        longitude: -13.558,
        altitude: 5,
      },
      position: gpsToWorld(29.115, -13.558, 5),
      dimensions: {
        width: 800,
        height: 100,
        length: 800,
      },
      nextPhases: [],
    },
  },
};

// Calculate the center position based on takeoffs
const calculateCenterPosition = (takeoffs: Takeoff[]): THREE.Vector3 => {
  if (takeoffs.length === 0) return new THREE.Vector3(0, 0, 0);

  const sum = takeoffs.reduce(
    (acc, takeoff) => {
      return acc.add(takeoff.position);
    },
    new THREE.Vector3(0, 0, 0)
  );

  return sum.divideScalar(takeoffs.length);
};

// Update position and camera lookAt
metadata.position = calculateCenterPosition(takeoffs);
metadata.cameraView.lookAt = metadata.position.clone();

// Create the complete Famara location
const famara: Location = {
  ...metadata,
  takeoffs,
  landingSpots,
  flyzone,
};

export default famara;
