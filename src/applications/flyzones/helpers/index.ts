// Export marker functionality
export {
  MarkerObject,
  createMarker,
  createSimpleMarker as createBasicMarker,
  setupLabelRenderer,
  createFadeAnimation,
  createHoverAnimations,
  createPinMesh,
  createVisibilityHandler,
  setupPinBasics,
} from '../markers/marker';

// Marker interface is exported from ./types
export { createSimpleMarker } from '../markers/marker-creator';

// Export types and helpers (avoid duplication)
export * from './types';
export * from './popup';
export * from './flyzone';

// Re-export configuration constants
export { FLYZONE_COLORS } from '../config/flyzone-config';
export { WIND_ARROW } from '../config/wind-config';
export {
  VISIBILITY_THRESHOLDS,
  TAKEOFF_VISIBILITY_THRESHOLD,
  PIN_COLORS,
  PIN_SIZES,
  PIN_FADE_DURATION,
} from '../config/marker-config';
