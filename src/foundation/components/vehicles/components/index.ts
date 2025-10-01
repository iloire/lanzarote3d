// Vehicle component exports (wings, gliders, etc.)
export { Wing } from './Wing';
export type { WingOptions } from './Wing';

export { default as HangGliderWing } from './HangGliderWing';
export { default as LegacyGlider, type GliderOptions } from './Glider';

// Legacy Pilot export (moved to characters folder)
// Import from '../characters/Pilot' for new code
export { default as LegacyPilot } from './Pilot';
