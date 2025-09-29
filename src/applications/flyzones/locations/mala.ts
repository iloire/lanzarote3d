import * as THREE from 'three';
import { Location, Takeoff, LandingSpot, FlyZoneShape } from './index';
import { gpsToWorld } from '../helpers/gps';

// Mala Metadata
const metadata = {
  id: 'mala',
  title: 'Mala',
  description:
    'Spectacular coastal cliff flying site with dramatic views and excellent soaring conditions in northeast winds.',
  position: new THREE.Vector3(0, 0, 0), // Will be calculated from takeoffs
  cameraView: {
    position: new THREE.Vector3(8000, 1500, 2000),
    lookAt: new THREE.Vector3(0, 0, 0), // Will be updated to match position
  },
};

// Mala Takeoffs
const takeoffs: Takeoff[] = [
  {
    id: 'takeoff-mala-main',
    title: 'Mala Main Takeoff',
    description: 'Primary takeoff point on the cliff edge with excellent ridge lift in NE winds.',
    gps: {
      latitude: 28.9547,
      longitude: -13.6975,
      altitude: 180,
    },
    position: gpsToWorld(28.9547, -13.6975, 180),
    elevation: 180,
    conditions: [
      {
        direction: {
          ideal: 45,
          range: [20, 80],
        },
        speed: {
          min: 8,
          max: 22,
          ideal: 14,
        },
        rating: 5,
        description: 'Excellent ridge lift in NE winds',
      },
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/mala-takeoff.jpg',
        title: 'Mala Takeoff',
      },
    ],
  },
  {
    id: 'takeoff-mala-north',
    title: 'Mala North Takeoff',
    description: 'Alternative takeoff for stronger wind conditions, slightly higher elevation.',
    gps: {
      latitude: 28.9555,
      longitude: -13.6965,
      altitude: 200,
    },
    position: gpsToWorld(28.9555, -13.6965, 200),
    elevation: 200,
    conditions: [
      {
        direction: {
          ideal: 50,
          range: [30, 90],
        },
        speed: {
          min: 12,
          max: 25,
          ideal: 18,
        },
        rating: 4,
        description: 'Good for stronger wind conditions',
      },
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/mala-north.jpg',
        title: 'Mala North',
      },
    ],
  },
];

// Mala Landing Spots
const landingSpots: LandingSpot[] = [
  {
    id: 'landing-mala-beach',
    title: 'Mala Beach Landing',
    description:
      'Small rocky beach below the cliffs, suitable for experienced pilots in calm conditions.',
    gps: {
      latitude: 28.954,
      longitude: -13.6985,
      altitude: 5,
    },
    position: gpsToWorld(28.954, -13.6985, 5),
    elevation: 5,
    type: 'secondary',
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/mala-beach.jpg',
        title: 'Mala Beach',
      },
    ],
  },
  {
    id: 'landing-puerto-del-carmen',
    title: 'Puerto del Carmen Area',
    description: 'Safer landing option in the town area, requires careful approach over buildings.',
    gps: {
      latitude: 28.952,
      longitude: -13.685,
      altitude: 15,
    },
    position: gpsToWorld(28.952, -13.685, 15),
    elevation: 15,
    type: 'primary',
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/puerto-carmen.jpg',
        title: 'Puerto del Carmen',
      },
    ],
  },
];

// Mala Flyzone
const flyzone: FlyZoneShape = {
  color: 0xff6600, // Orange color for Mala
  phases: {
    takeoff: {
      type: 'takeoff',
      gps: {
        latitude: 28.9551,
        longitude: -13.697,
        altitude: 190,
      },
      position: gpsToWorld(28.9551, -13.697, 190),
      dimensions: {
        width: 400,
        height: 80,
        length: 300,
      },
      nextPhases: ['ridge'],
    },
    ridge: {
      type: 'ridge',
      gps: {
        latitude: 28.9545,
        longitude: -13.698,
        altitude: 120,
      },
      position: gpsToWorld(28.9545, -13.698, 120),
      dimensions: {
        width: 1500,
        height: 300,
        length: 400,
      },
      nextPhases: ['landing'],
    },
    landing: {
      type: 'landing',
      gps: {
        latitude: 28.953,
        longitude: -13.687,
        altitude: 10,
      },
      position: gpsToWorld(28.953, -13.687, 10),
      dimensions: {
        width: 600,
        height: 80,
        length: 600,
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

// Create the complete Mala location
const mala: Location = {
  ...metadata,
  takeoffs,
  landingSpots,
  flyzone,
};

export default mala;
