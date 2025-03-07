// Flyzone colors
export const FLYZONE_COLORS = {
  safe: 0x00ff00,
  caution: 0xffff00,
  danger: 0xff0000
};

// Landing colors
export const LANDING_COLORS = {
  primary: 0x00ff00,
  secondary: 0xffff00,
  emergency: 0xff0000
}; 


export interface FlyZoneConfig {
  display: {
    flyzone: boolean;
    markers: boolean;
    labels: boolean;
    windArrows: boolean;
  };
  colors: {
    takeoff: number;
    landing: number;
    ridge: number;
    approach: number;
  };
  opacity: {
    boxes: number;
    lines: number;
  };
}

export const defaultConfig: FlyZoneConfig = {
  display: {
    flyzone: false, // Hidden by default
    markers: true,
    labels: true,
    windArrows: true
  },
  colors: {
    takeoff: 0xff0000,    // Red
    landing: 0x00ff00,    // Green
    ridge: 0x0000ff,      // Blue
    approach: 0xffff00    // Yellow
  },
  opacity: {
    boxes: 0.2,
    lines: 0.3
  }
};

let currentConfig: FlyZoneConfig = { ...defaultConfig };

export const getConfig = (): FlyZoneConfig => currentConfig;

export interface ConfigUpdate {
  display?: Partial<FlyZoneConfig['display']>;
  colors?: Partial<FlyZoneConfig['colors']>;
  opacity?: Partial<FlyZoneConfig['opacity']>;
}

export const updateConfig = (newConfig: ConfigUpdate) => {
  if (newConfig.display) {
    currentConfig.display = {
      ...currentConfig.display,
      ...newConfig.display
    };
  }
  
  if (newConfig.colors) {
    currentConfig.colors = {
      ...currentConfig.colors,
      ...newConfig.colors
    };
  }
  
  if (newConfig.opacity) {
    currentConfig.opacity = {
      ...currentConfig.opacity,
      ...newConfig.opacity
    };
  }
  
  return currentConfig;
}; 