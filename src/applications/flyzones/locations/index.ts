// Re-export all types from helpers/types
export * from '../helpers/types';

// Import locations
import famara from './famara';
import teguise from './teguise';
import mala from './mala';
import playaQuemada from './playa-quemada';
import { Location as FlyLocation } from '../helpers/types';

// Export individual locations
export { default as famara } from './famara';
export { default as teguise } from './teguise';
export { default as mala } from './mala';
export { default as playaQuemada } from './playa-quemada';

// Create a default export with all locations
const locations: FlyLocation[] = [famara, teguise, mala, playaQuemada];

export default locations;
