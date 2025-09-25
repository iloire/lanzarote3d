import * as THREE from 'three';
import { LANZAROTE_GPS_CONFIG } from '../config/gps-config';

// Define the GPS anchor point (a known location in both coordinate systems)
export interface GPSAnchor {
  // Real-world GPS coordinates
  gps: {
    latitude: number;  // degrees
    longitude: number; // degrees
    altitude: number;  // meters above sea level
  };
  // Corresponding 3D world coordinates
  world: THREE.Vector3;
}

// Define the scale and orientation of the world
export interface WorldScale {
  // Meters per degree of latitude/longitude at the anchor point
  metersPerDegreeLatitude: number;
  metersPerDegreeLongitude: number;
  // Rotation of the world coordinate system relative to true north (in radians)
  northOffset: number;
}

// Use the configuration from gps-config.ts
const LANZAROTE_ANCHOR: GPSAnchor = LANZAROTE_GPS_CONFIG.anchor;
const LANZAROTE_SCALE: WorldScale = LANZAROTE_GPS_CONFIG.scale;

/**
 * Converts GPS coordinates to 3D world coordinates
 */
export function gpsToWorld(
  latitude: number, 
  longitude: number, 
  altitude: number = 0,
  anchor: GPSAnchor = LANZAROTE_ANCHOR,
  scale: WorldScale = LANZAROTE_SCALE
): THREE.Vector3 {
  // Calculate differences in degrees
  const latDiff = latitude - anchor.gps.latitude;
  const lonDiff = longitude - anchor.gps.longitude;
  const altDiff = altitude - anchor.gps.altitude;
  
  // Convert to meters
  const northSouth = latDiff * scale.metersPerDegreeLatitude;
  const eastWest = lonDiff * scale.metersPerDegreeLongitude;
  
  // Apply rotation if the world is not aligned with true north
  const x = eastWest * Math.cos(scale.northOffset) - northSouth * Math.sin(scale.northOffset);
  const z = eastWest * Math.sin(scale.northOffset) + northSouth * Math.cos(scale.northOffset);
  
  // Create the world position (adding the anchor position)
  return new THREE.Vector3(
    anchor.world.x + x,
    anchor.world.y + altDiff,
    anchor.world.z + z
  );
}

/**
 * Converts 3D world coordinates to GPS coordinates
 */
export function worldToGPS(
  position: THREE.Vector3,
  anchor: GPSAnchor = LANZAROTE_ANCHOR,
  scale: WorldScale = LANZAROTE_SCALE
): { latitude: number, longitude: number, altitude: number } {
  // Calculate differences in world coordinates
  const xDiff = position.x - anchor.world.x;
  const yDiff = position.y - anchor.world.y;
  const zDiff = position.z - anchor.world.z;
  
  // Rotate back if the world is not aligned with true north
  const eastWest = xDiff * Math.cos(-scale.northOffset) - zDiff * Math.sin(-scale.northOffset);
  const northSouth = xDiff * Math.sin(-scale.northOffset) + zDiff * Math.cos(-scale.northOffset);
  
  // Convert to degrees
  const latDiff = northSouth / scale.metersPerDegreeLatitude;
  const lonDiff = eastWest / scale.metersPerDegreeLongitude;
  
  return {
    latitude: anchor.gps.latitude + latDiff,
    longitude: anchor.gps.longitude + lonDiff,
    altitude: anchor.gps.altitude + yDiff
  };
}

// Export the default configuration
export const defaultAnchor = LANZAROTE_ANCHOR;
export const defaultScale = LANZAROTE_SCALE; 