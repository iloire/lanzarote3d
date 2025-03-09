import * as THREE from 'three';
import { Location, Takeoff, LandingSpot, FlyZoneShape } from './index';
import { gpsToWorld } from '../helpers/gps';

// Teguise Metadata
const metadata = {
  id: 'teguise',
  title: 'Teguise',
  description: 'A beautiful area with diverse flying conditions and stunning views of Lanzarote.',
  position: new THREE.Vector3(0, 0, 0), // Will be calculated from takeoffs
  cameraView: {
    position: new THREE.Vector3(5000, 2000, 5000),
    lookAt: new THREE.Vector3(0, 0, 0) // Will be updated to match position
  }
};

// Teguise Takeoffs
const takeoffs: Takeoff[] = [
  {
    id: 'takeoff-teguise-main',
    title: 'Teguise Main Takeoff',
    description: 'Main takeoff point with excellent thermal conditions.',
    gps: {
      latitude: 29.0750,
      longitude: -13.5200,
      altitude: 380
    },
    position: gpsToWorld(29.0750, -13.5200, 380),
    elevation: 380,
    conditions: [
      {
        direction: {
          ideal: 270,
          range: [240, 300]
        },
        speed: {
          min: 8,
          max: 22,
          ideal: 15
        },
        rating: 5,
        description: 'Perfect thermal conditions'
      }
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/teguise-main.jpg',
        title: 'Teguise Main Takeoff'
      }
    ]
  },
  {
    id: 'takeoff-teguise-east',
    title: 'Teguise East Takeoff',
    description: 'Eastern takeoff with good morning conditions.',
    gps: {
      latitude: 29.0760,
      longitude: -13.5150,
      altitude: 350
    },
    position: gpsToWorld(29.0760, -13.5150, 350),
    elevation: 350,
    conditions: [
      {
        direction: {
          ideal: 90,
          range: [60, 120]
        },
        speed: {
          min: 5,
          max: 18,
          ideal: 12
        },
        rating: 4,
        description: 'Good morning conditions'
      }
    ],
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/teguise-east.jpg',
        title: 'Teguise East'
      }
    ]
  }
];

// Teguise Landing Spots
const landingSpots: LandingSpot[] = [
  {
    id: 'landing-teguise-main',
    title: 'Teguise Main Landing',
    description: 'Main landing area with ample space and easy access.',
    gps: {
      latitude: 29.0730,
      longitude: -13.5180,
      altitude: 120
    },
    position: gpsToWorld(29.0730, -13.5180, 120),
    elevation: 120,
    type: 'primary',
    mediaItems: [
      {
        type: 'image',
        url: '/assets/images/teguise-landing.jpg',
        title: 'Teguise Landing'
      }
    ]
  }
];

// Teguise Flyzone
const flyzone: FlyZoneShape = {
  color: 0x0000ff,
  phases: {
    takeoff: {
      type: 'takeoff',
      gps: {
        latitude: 29.0750,
        longitude: -13.5200,
        altitude: 380
      },
      position: gpsToWorld(29.0750, -13.5200, 380),
      dimensions: {
        width: 400,
        height: 100,
        length: 400
      },
      nextPhases: ['thermal']
    },
    thermal: {
      type: 'thermal',
      gps: {
        latitude: 29.0740,
        longitude: -13.5190,
        altitude: 600
      },
      position: gpsToWorld(29.0740, -13.5190, 600),
      dimensions: {
        width: 1000,
        height: 800,
        length: 1000
      },
      nextPhases: ['landing']
    },
    landing: {
      type: 'landing',
      gps: {
        latitude: 29.0730,
        longitude: -13.5180,
        altitude: 120
      },
      position: gpsToWorld(29.0730, -13.5180, 120),
      dimensions: {
        width: 600,
        height: 100,
        length: 600
      },
      nextPhases: []
    }
  }
};

// Calculate the center position based on takeoffs
const calculateCenterPosition = (takeoffs: Takeoff[]): THREE.Vector3 => {
  if (takeoffs.length === 0) return new THREE.Vector3(0, 0, 0);
  
  const sum = takeoffs.reduce((acc, takeoff) => {
    return acc.add(takeoff.position);
  }, new THREE.Vector3(0, 0, 0));
  
  return sum.divideScalar(takeoffs.length);
};

// Update position and camera lookAt
metadata.position = calculateCenterPosition(takeoffs);
metadata.cameraView.lookAt = metadata.position.clone();

// Create the complete Teguise location
const teguise: Location = {
  ...metadata,
  takeoffs,
  landingSpots,
  flyzone
};

export default teguise; 