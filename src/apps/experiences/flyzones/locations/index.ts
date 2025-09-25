// Re-export all types from helpers/types
export * from '../helpers/types';

// Import locations
import famara from './famara';
import teguise from './teguise';
import { Location as FlyLocation } from '../helpers/types';

// Export individual locations
export { default as famara } from './famara';
export { default as teguise } from './teguise';

// Create a default export with all locations
const locations: FlyLocation[] = [
  famara,
  teguise
];

export default locations;
