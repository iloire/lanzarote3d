// Vehicle components exports
import LegacyParaglider from './Paraglider';
import Hangglider from './Hangglider';
import ParagliderVoxel from './ParagliderVoxel';
import Tandem from './Tandem';
import LegacyGlider from './Glider';
import LegacyWing from './Wing';

// Modern vehicle components

export { Boat, BoatType } from './BoatComponent';
export type { BoatOptions, BoatMovement } from './BoatComponent';

export { Wing } from './WingComponent';
export type { WingOptions } from './WingComponent';

export { Glider } from './GliderComponent';
export type { GliderOptions as ModernGliderOptions, GliderState } from './GliderComponent';

// Type exports
export type { VehicleConfig } from '../../types';
export type { ParagliderVoxelOptions } from './ParagliderVoxel';
// Note: Pilot moved to characters folder - import from '../characters' instead

// Legacy component exports
export { LegacyParaglider, Hangglider, ParagliderVoxel, Tandem, LegacyGlider, LegacyWing };
