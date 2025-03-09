import * as THREE from "three";
import {
  GPS,
  Media,
  WindDirection,
  WindCondition,
  Takeoff,
  LandingSpot,
  FlightPhase,
  FlyZoneShape,
  LocationMetadata,
  Location
} from '../helpers/types';

// Import locations
import famara from './famara';
import teguise from './teguise';

// Export type definitions
export {
  GPS,
  Media,
  WindDirection,
  WindCondition,
  Takeoff,
  LandingSpot,
  FlightPhase,
  FlyZoneShape,
  LocationMetadata,
  Location
};

// Export individual locations
export { default as famara } from './famara';
export { default as teguise } from './teguise';

// Create a default export with all locations
const locations: Location[] = [
  famara,
  teguise
];

export default locations;
