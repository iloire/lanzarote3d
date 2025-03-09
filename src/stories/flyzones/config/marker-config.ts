import { MarkerType } from '../helpers/types';

// Pin colors for different marker types
export const PIN_COLORS = {
  [MarkerType.LOCATION]: { main: 0xff0000, emissive: 0x440000 },
  [MarkerType.TAKEOFF]: { main: 0x00ff00, emissive: 0x000044 },
  [MarkerType.LANDING]: { main: 0x0000ff, emissive: 0x004400 },
};

// Pin sizes for different marker types
export const PIN_SIZES = {
  [MarkerType.LOCATION]: { radius: 300, height: 1500 },
  [MarkerType.TAKEOFF]: { radius: 100, height: 150 },
  [MarkerType.LANDING]: { radius: 300, height: 50 },
};

// Pin fade duration (in milliseconds)
export const PIN_FADE_DURATION = 200;

// Visibility thresholds
export const TAKEOFF_VISIBILITY_THRESHOLD = 15000;

export const VISIBILITY_THRESHOLDS = {
  LOCATION_PIN: 5000,  // Show location pins when far away
  DETAIL_VIEW: 2000,   // Show detailed markers when close
  TAKEOFF: 3000,       // Show takeoff markers when within this distance
  LANDING: 3000        // Show landing markers when within this distance
}; 