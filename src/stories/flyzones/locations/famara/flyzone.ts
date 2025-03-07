import * as THREE from 'three';
import { FlyZoneShape } from '../index';
import { gpsToWorld } from '../../helpers/gps';

// Define GPS coordinates for each flyzone phase
const phaseGPS = {
  takeoff: {
    type: 'takeoff' as const,
    gps: {
      latitude: 29.1195,
      longitude: -13.5645,
      altitude: 600
    },
    dimensions: {
      width: 500,
      height: 200,
      length: 500
    },
    nextPhases: ['ridge']
  },
  ridge: {
    type: 'ridge' as const,
    gps: {
      latitude: 29.1190,
      longitude: -13.5640,
      altitude: 500
    },
    dimensions: {
      width: 2000,
      height: 400,
      length: 500
    },
    nextPhases: ['approach']
  },
  approach: {
    type: 'approach' as const,
    gps: {
      latitude: 29.1185,
      longitude: -13.5635,
      altitude: 250
    },
    dimensions: {
      width: 500,
      height: 300,
      length: 500
    },
    nextPhases: ['landing']
  },
  landing: {
    type: 'landing' as const,
    gps: {
      latitude: 29.1180,
      longitude: -13.5630,
      altitude: 50
    },
    dimensions: {
      width: 500,
      height: 100,
      length: 500
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