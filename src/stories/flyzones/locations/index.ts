// Re-export all types from helpers/types
export * from '../helpers/types';

// Import locations
import famara from './famara';
import teguise from './teguise';

// Types are exported above with export *

// Export individual locations
export { default as famara } from './famara';
export { default as teguise } from './teguise';

// Create a default export with all locations
const locations: Location[] = [
  famara,
  teguise
];

export default locations;
