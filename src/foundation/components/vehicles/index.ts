// Vehicle components exports
import Paraglider from './Paraglider';
import Hangglider from './Hangglider';
import ParagliderVoxel from './ParagliderVoxel';
import Tandem from './Tandem';
import LegacyGlider from './Glider';
import HangGliderWing from './HangGliderWing';
import Car from './Car';
import Truck from './Truck';

// Modern vehicle components

export { Wing } from './Wing';
export type { WingOptions } from './Wing';

export { Car } from './Car';
export type { CarOptions } from './Car';

export { Truck } from './Truck';
export type { TruckOptions } from './Truck';

export { AutonomousCar } from './AutonomousCar';
export type { AutonomousCarOptions } from './AutonomousCar';

// Type exports
export type { VehicleConfig } from '../../types';
export type { ParagliderVoxelOptions } from './ParagliderVoxel';
// Note: Pilot moved to characters folder - import from '../characters' instead

// Legacy component exports
export { Paraglider, Hangglider, ParagliderVoxel, Tandem, LegacyGlider, HangGliderWing };
