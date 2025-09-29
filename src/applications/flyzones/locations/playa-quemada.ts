import * as THREE from 'three';
import { Location, Takeoff, LandingSpot, FlyZoneShape } from './index';
import { gpsToWorld } from '../helpers/gps';

// Playa Quemada Metadata
const metadata = {
  id: 'playa-quemada',
  title: 'Playa Quemada',
  description:
    'Remote coastal flying site with pristine volcanic landscape and reliable thermal conditions.',
  position: new THREE.Vector3(0, 0, 0), // Will be calculated from takeoffs
  cameraView: {
    position: new THREE.Vector3(9500, 1800, -1500),
    lookAt: new THREE.Vector3(0, 0, 0), // Will be updated to match position
  },
};

// Playa Quemada Takeoffs
const takeoffs: Takeoff[] = [
  {
    id: 'takeoff-quemada-main',
    title: 'Playa Quemada Main Takeoff',
    description:
      'Primary launch site overlooking the dramatic volcanic coastline with good thermal potential.',
    gps: {
      latitude: 28.918,
      longitude: -13.7325,
      altitude: 165,
    },
    position: gpsToWorld(28.918, -13.7325, 165),
    elevation: 165,
    conditions: [
      {
        direction: {
          ideal: 60,
          range: [30, 100],
        },
        speed: {
          min: 6,
          max: 18,
          ideal: 12,
        },
        rating: 4,
        description: 'Good thermal conditions, light to moderate winds',
      },
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/quemada-takeoff.jpg',
        title: 'Playa Quemada Takeoff',
      },
    ],
  },
  {
    id: 'takeoff-quemada-south',
    title: 'Playa Quemada South',
    description: 'Southern takeoff point with protection from strong northeast winds.',
    gps: {
      latitude: 28.9165,
      longitude: -13.7335,
      altitude: 140,
    },
    position: gpsToWorld(28.9165, -13.7335, 140),
    elevation: 140,
    conditions: [
      {
        direction: {
          ideal: 90,
          range: [60, 120],
        },
        speed: {
          min: 8,
          max: 20,
          ideal: 14,
        },
        rating: 4,
        description: 'Protected from strong NE winds',
      },
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/quemada-south.jpg',
        title: 'Playa Quemada South',
      },
    ],
  },
];

// Playa Quemada Landing Spots
const landingSpots: LandingSpot[] = [
  {
    id: 'landing-quemada-beach',
    title: 'Playa Quemada Beach',
    description: 'Small volcanic beach with dark sand, suitable landing in calm conditions.',
    gps: {
      latitude: 28.917,
      longitude: -13.734,
      altitude: 3,
    },
    position: gpsToWorld(28.917, -13.734, 3),
    elevation: 3,
    type: 'primary',
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/quemada-beach.jpg',
        title: 'Playa Quemada Beach',
      },
    ],
  },
  {
    id: 'landing-quemada-field',
    title: 'Inland Field',
    description: 'Open field inland from the coast, safer option in stronger wind conditions.',
    gps: {
      latitude: 28.919,
      longitude: -13.728,
      altitude: 25,
    },
    position: gpsToWorld(28.919, -13.728, 25),
    elevation: 25,
    type: 'secondary',
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/quemada-field.jpg',
        title: 'Inland Field',
      },
    ],
  },
];

// Playa Quemada Flyzone
const flyzone: FlyZoneShape = {
  color: 0x9400d3, // Purple color for Playa Quemada
  phases: {
    takeoff: {
      type: 'takeoff',
      gps: {
        latitude: 28.9173,
        longitude: -13.733,
        altitude: 153,
      },
      position: gpsToWorld(28.9173, -13.733, 153),
      dimensions: {
        width: 350,
        height: 70,
        length: 350,
      },
      nextPhases: ['thermal'],
    },
    thermal: {
      type: 'thermal',
      gps: {
        latitude: 28.918,
        longitude: -13.731,
        altitude: 200,
      },
      position: gpsToWorld(28.918, -13.731, 200),
      dimensions: {
        width: 800,
        height: 400,
        length: 800,
      },
      nextPhases: ['landing'],
    },
    landing: {
      type: 'landing',
      gps: {
        latitude: 28.917,
        longitude: -13.734,
        altitude: 3,
      },
      position: gpsToWorld(28.917, -13.734, 3),
      dimensions: {
        width: 500,
        height: 60,
        length: 500,
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

// Create the complete Playa Quemada location
const playaQuemada: Location = {
  ...metadata,
  takeoffs,
  landingSpots,
  flyzone,
};

export default playaQuemada;
