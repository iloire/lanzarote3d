import * as THREE from 'three';
import { FlyZoneShape } from '../index';
import { gpsToWorld } from '../../helpers/gps';

// Define GPS coordinates for each flyzone phase
const phaseGPS = {
  takeoff: {
    type: 'takeoff' as const,
    gps: {
      latitude: 28.9510,
      longitude: -13.6810,
      altitude: 300
    },
    dimensions: {
      width: 300,
      height: 150,
      length: 300
    },
    nextPhases: ['thermal']
  },
  thermal: {
    type: 'ridge' as const,
    gps: {
      latitude: 28.9512,
      longitude: -13.6808,
      altitude: 500
    },
    dimensions: {
      width: 600,
      height: 400,
      length: 600
    },
    nextPhases: ['approach']
  },
  approach: {
    type: 'approach' as const,
    gps: {
      latitude: 28.9514,
      longitude: -13.6806,
      altitude: 200
    },
    dimensions: {
      width: 400,
      height: 250,
      length: 400
    },
    nextPhases: ['landing']
  },
  landing: {
    type: 'landing' as const,
    gps: {
      latitude: 28.9515,
      longitude: -13.6805,
      altitude: 40
    },
    dimensions: {
      width: 300,
      height: 80,
      length: 300
    },
    // Landing is the final phase, so it has no next phases
    nextPhases: []
  }
};

// Convert GPS to world coordinates
const phases: Record<string, any> = {};
Object.keys(phaseGPS).forEach(key => {
  const phase = phaseGPS[key as keyof typeof phaseGPS];
  phases[key] = {
    type: phase.type,
    gps: phase.gps,
    position: gpsToWorld(phase.gps.latitude, phase.gps.longitude, phase.gps.altitude),
    dimensions: phase.dimensions,
    nextPhases: phase.nextPhases
  };
});

const flyzone: FlyZoneShape = {
  phases
};

export default flyzone; 