// Vehicle components exports
import Paraglider from './Paraglider';
import Hangglider from './Hangglider';
import ParagliderVoxel from './ParagliderVoxel';
import Tandem from './Tandem';
import Glider from './Glider';
import Wing from './Wing';

// Modern vehicle components
export { ParagliderComponent } from './ParagliderComponent';
export type { ParagliderOptions as ModernParagliderOptions, FlyingState } from './ParagliderComponent';

export { BoatComponent, BoatType } from './BoatComponent';
export type { BoatOptions, BoatMovement } from './BoatComponent';

export { WingComponent } from './WingComponent';
export type { WingOptions } from './WingComponent';

export { GliderComponent } from './GliderComponent';
export type { GliderOptions as ModernGliderOptions, GliderState } from './GliderComponent';

// Type exports
export type { VehicleConfig } from '../../types';
export type { ParagliderOptions } from './Paraglider';
export type { ParagliderVoxelOptions } from './ParagliderVoxel';
// Note: Pilot moved to characters folder - import from '../characters' instead

// Legacy component exports
export { Paraglider, Hangglider, ParagliderVoxel, Tandem, Glider, Wing };
