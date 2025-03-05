import { MarkerType } from './types';

export const TAKEOFF_VISIBILITY_THRESHOLD = 15000;

export const PIN_COLORS = {
  [MarkerType.LOCATION]: { main: 0xff0000, emissive: 0x440000 },
  [MarkerType.TAKEOFF]: { main: 0x00ff00, emissive: 0x000044 },
  [MarkerType.LANDING]: { main: 0x0000ff, emissive: 0x004400 },
};

export const PIN_SIZES = {
  [MarkerType.LOCATION]: { radius: 300, height: 1500 },
  [MarkerType.TAKEOFF]: { radius: 100, height: 150 },
  [MarkerType.LANDING]: { radius: 300, height: 50 },
};

export const PIN_FADE_DURATION = 200;

export const FLYZONE_COLORS = {
  safe: 0x00ff00,
  caution: 0xffff00,
  danger: 0xff0000
};

export const LANDING_COLORS = {
  primary: 0x00ff00,
  secondary: 0xffff00,
  emergency: 0xff0000
};

export const VISIBILITY_THRESHOLDS = {
  LOCATION_PIN: 15000,    // Show location pin when far (> 15000)
  DETAIL_VIEW: 15000,     // Switch to detailed view when closer than this
};

export const WIND_ARROW = {
  height: 1000,
  radius: 50,
  color: 0x0066ff,
  opacity: 0.8,
  bodyRatio: 0.7,  // Body is 70% of total height
  headRatio: 0.3   // Head is 30% of total height
}; 