// Lanzarote3D Foundation Library v2.0.0
// Clean public API for 3D flight simulation components

// Component categories - organized by domain
export * from './components/vehicles'; // Paragliders, pilots, hanggliders
export * from './components/environment'; // Sky, water, clouds, terrain
export * from './components/physics'; // Weather, thermals, wind
export * from './components/ui'; // Trajectories, 3D UI elements

// Core systems
export * from './systems/assets/AssetManager'; // Asset loading & caching
export { SceneManager, CameraController } from './systems/scene'; // Scene management, camera controls
export * from './systems/controls'; // Flight controls, input handling
export * from './systems/audio'; // Sound management, positional audio
export * from './systems/analytics'; // Performance monitoring, user analytics

// Utilities
export * from './utils';

// Type definitions
export * from './types';