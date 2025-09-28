// Vehicle components exports
import Paraglider from './Paraglider';
import Hangglider from './Hangglider';
import ParagliderVoxel from './ParagliderVoxel';
import Tandem from './Tandem';
import LegacyGlider from './Glider';
import HangGliderWing from './HangGliderWing';

// Modern vehicle components

export { Boat, BoatType } from './Boat';
export type { BoatOptions, BoatMovement } from './Boat';

export { Wing } from './Wing';
export type { WingOptions } from './Wing';

export { NewGlider } from './GliderComponent';
export type { GliderOptions as ModernGliderOptions, GliderState } from './GliderComponent';

// Type exports
export type { VehicleConfig } from '../../types';
export type { ParagliderVoxelOptions } from './ParagliderVoxel';
// Note: Pilot moved to characters folder - import from '../characters' instead

// Legacy component exports
export { Paraglider, Hangglider, ParagliderVoxel, Tandem, LegacyGlider, HangGliderWing };
