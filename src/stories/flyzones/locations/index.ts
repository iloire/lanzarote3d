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
import famara from './famara/index';

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
export { default as famara } from './famara/index';

// Create a default export with all locations
const locations: Location[] = [
  famara
];

export default locations;
