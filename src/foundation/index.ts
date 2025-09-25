// Lanzarote3D Foundation Library v2.0.0
// Clean public API for 3D flight simulation components

// Component categories - organized by domain
export * from './components/vehicles';    // Paragliders, pilots, hanggliders
export * from './components/environment'; // Sky, water, clouds, terrain
export * from './components/physics';     // Weather, thermals, wind
export * from './components/ui';          // Trajectories, 3D UI elements

// Core systems
export * from './systems/assets/AssetManager'; // Asset loading & caching

// Utilities
export * from './utils';

// Type definitions
export * from './types';

// Foundation metadata
export const FOUNDATION_VERSION = '2.0.0';
export const FOUNDATION_NAME = 'Lanzarote3D Foundation';

// Phase 2 completion marker
export const PHASE_2_COMPLETE = true;