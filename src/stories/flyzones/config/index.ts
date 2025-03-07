// Re-export all configuration
export * from './gps-config';
export * from './marker-config';
export * from './flyzone-config';
export * from './wind-config';
export * from '../config';

// General configuration
export const defaultConfig = {
  showTakeoffs: true,
  showLandings: false,
  showFlyzones: true,
  showWind: true,
  windSpeed: 15,
  windDirection: 270, // degrees, 0 = North, 90 = East, etc.
};

// Function to get configuration (could be extended to load from localStorage)
export const getConfig = () => {
  return { ...defaultConfig };
};

// Function to update configuration
export const updateConfig = (newConfig: Partial<typeof defaultConfig>) => {
  Object.assign(defaultConfig, newConfig);
  return { ...defaultConfig };
}; 