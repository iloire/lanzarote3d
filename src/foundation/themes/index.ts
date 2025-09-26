import { Theme } from '../types/Theme';

export const THEMES: Record<string, Theme> = {
  sunset: {
    id: 'sunset',
    name: 'Sunset Romance',
    sky: {
      timeOfDay: 19,
      sunIntensity: 2.3,
      fogColor: '#ff6b6b',
      fogDensity: 0.0015,
    },
    clouds: {
      colors: ['#F64A8A', '#F987C5', '#DE3163', '#FFB6C1', '#FF69B4', '#E6004D'],
      density: 1.0,
      opacity: 0.8,
    },
    terrain: {
      style: 'volcanic',
      customMaterial: {
        emissiveIntensity: 0.8,
      },
    },
    water: {
      color: '#ff1744',
      opacity: 0.7,
      waveIntensity: 0.6,
    },
    weather: {
      windDirectionDegreesFromNorth: 310,
      speedMetresPerSecond: 5,
      lclLevel: 1800,
    },
    ambient: {
      lightingIntensity: 1.2,
      shadowIntensity: 0.8,
    },
  },

  golden: {
    id: 'golden',
    name: 'Golden Hour',
    sky: {
      timeOfDay: 17.5,
      sunIntensity: 2.0,
      fogColor: '#ffd54f',
      fogDensity: 0.001,
    },
    clouds: {
      colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFFF99', '#FFE135', '#DAA520', '#FFF8F0', '#FF6B6B'],
      density: 0.8,
      opacity: 0.9,
    },
    terrain: {
      style: 'desert',
      customMaterial: {
        emissiveIntensity: 0.5,
      },
    },
    water: {
      color: '#ffb74d',
      opacity: 0.8,
      waveIntensity: 0.4,
    },
    weather: {
      windDirectionDegreesFromNorth: 270,
      speedMetresPerSecond: 3,
      lclLevel: 2000,
    },
    ambient: {
      lightingIntensity: 1.4,
      shadowIntensity: 0.6,
    },
  },

  arctic: {
    id: 'arctic',
    name: 'Arctic Winter',
    sky: {
      timeOfDay: 14,
      sunIntensity: 1.8,
      fogColor: '#e3f2fd',
      fogDensity: 0.0005,
    },
    clouds: {
      colors: ['#FFFAFA', '#D3D3D3', '#808080', '#E0F6FF', '#B0E0E6', '#87CEEB'],
      density: 0.6,
      opacity: 0.95,
    },
    terrain: {
      style: 'arctic',
      customMaterial: {
        roughness: 0.1,
        metalness: 0.3,
      },
    },
    water: {
      color: '#1976d2',
      opacity: 0.9,
      waveIntensity: 0.2,
    },
    weather: {
      windDirectionDegreesFromNorth: 0,
      speedMetresPerSecond: 8,
      lclLevel: 1200,
    },
    ambient: {
      lightingIntensity: 0.9,
      shadowIntensity: 1.2,
    },
  },

  storm: {
    id: 'storm',
    name: 'Storm Clouds',
    sky: {
      timeOfDay: 15,
      sunIntensity: 1.2,
      fogColor: '#37474f',
      fogDensity: 0.0025,
    },
    clouds: {
      colors: ['#2F2F2F', '#4A4A4A', '#F5F5F5', '#1A1A1A', '#696969', '#D3D3D3', '#000000'],
      density: 1.2,
      opacity: 0.95,
    },
    terrain: {
      style: 'volcanic',
      customMaterial: {
        color: '#424242',
        emissiveIntensity: 0.3,
      },
    },
    water: {
      color: '#263238',
      opacity: 0.85,
      waveIntensity: 0.9,
    },
    weather: {
      windDirectionDegreesFromNorth: 45,
      speedMetresPerSecond: 12,
      lclLevel: 1500,
    },
    ambient: {
      lightingIntensity: 0.7,
      shadowIntensity: 1.4,
    },
  },

  autumn: {
    id: 'autumn',
    name: 'Autumn Mist',
    sky: {
      timeOfDay: 16,
      sunIntensity: 1.8,
      fogColor: '#d7ccc8',
      fogDensity: 0.002,
    },
    clouds: {
      colors: ['#CD853F', '#DEB887', '#F5DEB3', '#D2691E', '#BC8F8F', '#F4A460'],
      density: 0.7,
      opacity: 0.85,
    },
    terrain: {
      style: 'desert',
      customMaterial: {
        color: '#8d6e63',
        emissiveIntensity: 0.4,
      },
    },
    water: {
      color: '#6d4c41',
      opacity: 0.8,
      waveIntensity: 0.5,
    },
    weather: {
      windDirectionDegreesFromNorth: 225,
      speedMetresPerSecond: 6,
      lclLevel: 1600,
    },
    ambient: {
      lightingIntensity: 1.1,
      shadowIntensity: 0.9,
    },
  },

  natural: {
    id: 'natural',
    name: 'Natural Famara',
    sky: {
      timeOfDay: 13,
      sunIntensity: 2.2,
      fogColor: '#f5f5f5',
      fogDensity: 0.0005,
    },
    clouds: {
      colors: ['#ffffff', '#f0f8ff', '#e6f3ff', '#f5f5f5', '#fffafa'],
      density: 0.8,
      opacity: 0.9,
    },
    terrain: {
      style: 'desert',
      customMaterial: {
        roughness: 0.8,
        metalness: 0.0,
      },
    },
    water: {
      color: '#2196f3',
      opacity: 0.85,
      waveIntensity: 0.5,
    },
    weather: {
      windDirectionDegreesFromNorth: 310,
      speedMetresPerSecond: 5,
      lclLevel: 1800,
    },
    ambient: {
      lightingIntensity: 1.0,
      shadowIntensity: 1.0,
    },
  },
};

// Helper functions for theme management
export const getThemeById = (id: string): Theme | undefined => {
  return THEMES[id];
};

export const getAllThemes = (): Theme[] => {
  return Object.values(THEMES);
};

export default THEMES;