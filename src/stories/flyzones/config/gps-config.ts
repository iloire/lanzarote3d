import * as THREE from 'three';

// Lanzarote GPS configuration
// These values should be calibrated based on actual GPS measurements
export const LANZAROTE_GPS_CONFIG = {
  anchor: {
    gps: {
      latitude: 29.1187513,
      longitude: -13.5654236,
      altitude: 30
    },
    world: new THREE.Vector3(6642.48, 55.95, -3853.59),
  },
  scale: {
    metersPerDegreeLatitude: 111320, // Approximate meters per degree at this latitude
    metersPerDegreeLongitude: 107550, // Approximate meters per degree at this latitude
    northOffset: 0 // Assuming your world Z axis points north
  }
};

// You can add other locations or calibration points here 