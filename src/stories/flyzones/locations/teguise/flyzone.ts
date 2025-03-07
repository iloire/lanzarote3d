import * as THREE from 'three';
import { FlyZoneShape } from '../index';
import { gpsToWorld } from '../../helpers/gps';

// Define GPS coordinates for each flyzone phase
const phaseGPS = {
  takeoff: {
    type: 'takeoff' as const,
    gps: {
      latitude: 29.0660,
      longitude: -13.5160,
      altitude: 400
    },
    dimensions: {
      width: 400,
      height: 200,
      length: 400
    },
    nextPhases: ['approach']
  },
  approach: {
    type: 'approach' as const,
    gps: {
      latitude: 29.0663,
      longitude: -13.5157,
      altitude: 200
    },
    dimensions: {
      width: 400,
      height: 300,
      length: 400
    },
    nextPhases: ['landing']
  },
  landing: {
    type: 'landing' as const,
    gps: {
      latitude: 29.0665,
      longitude: -13.5155,
      altitude: 50
    },
    dimensions: {
      width: 400,
      height: 100,
      length: 400
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