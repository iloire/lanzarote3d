import { Theme } from '../types/Theme';

export const THEMES: Record<string, Theme> = {
  golden: {
    id: 'golden',
    name: 'Golden Hour',
    sky: {
      timeOfDay: 17.5,
      sunIntensity: 2.0,
      fogEnabled: false,
    },
    clouds: {
      colors: [
        '#FFD700',
        '#FFA500',
        '#FF8C00',
        '#FFFF99',
        '#FFE135',
        '#DAA520',
        '#FFF8F0',
        '#FF6B6B',
      ],
      density: 0.8,
      opacity: 0.9,
    },
    terrain: {
      style: 'desert',
      customMaterial: {
        color: '#DAA520',
        emissive: '#FFD700',
        emissiveIntensity: 0.5,
        roughness: 0.7,
        metalness: 0.0,
        opacity: 1.0,
        wireframe: true,
        visible: true,
      },
    },
    water: {
      color: 'orange',
      opacity: 0.5,
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
      fogEnabled: false,
      directionalLight: {
        intensity: 1.2,
        color: '#E6F3FF',
        castShadow: true,
        shadowMapSize: 4096,
        shadowCamera: {
          near: 0.5,
          far: 50000,
          left: -10000,
          right: 10000,
          top: 10000,
          bottom: -10000,
        },
      },
    },
    clouds: {
      colors: ['#FFFFFF', '#E6F3FF', '#87CEEB', '#2F4F4F'],
      density: 0.6,
      opacity: 0.95,
    },
    terrain: {
      style: 'arctic',
      customMaterial: {
        color: '#ffffff',
        emissive: '#87CEEB',
        emissiveIntensity: 0.2,
        roughness: 0.1,
        metalness: 0.3,
        opacity: 1.0,
        wireframe: true,
        visible: true,
      },
    },
    water: {
      color: '#1976d2',
      opacity: 0.9,
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
      fogEnabled: false,
      directionalLight: {
        intensity: 0.4,
        color: '#404040',
        castShadow: true,
        shadowMapSize: 1024,
      },
    },
    clouds: {
      colors: ['#2F2F2F', '#4A4A4A', '#F5F5F5', '#696969', '#D3D3D3'],
      density: 1.2,
      opacity: 0.95,
    },
    terrain: {
      style: 'volcanic',
      customMaterial: {
        color: '#FFFF00', // Bright yellow wireframe for dramatic storm effect
        emissive: '#FFD700', // Golden yellow glow
        emissiveIntensity: 0.4,
        roughness: 0.9,
        metalness: 0.0,
        wireframe: true, // Show terrain wireframe during storms
        opacity: 0.9,
        transparent: true,
        visible: true,
      },
    },
    water: {
      color: '#263238',
      opacity: 0.85,
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
      fogEnabled: false,
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
        emissive: '#D2691E',
        emissiveIntensity: 0.4,
        roughness: 0.8,
        metalness: 0.0,
        opacity: 1.0,
        wireframe: false,
        visible: true,
      },
    },
    water: {
      color: '#6d4c41',
      opacity: 0.8,
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
      fogEnabled: false,
    },
    clouds: {
      colors: ['#FFFFFF', '#E6F3FF', '#87CEEB'],
      density: 0.8,
      opacity: 0.9,
    },
    terrain: {
      style: 'desert',
      customMaterial: {
        color: '#A0522D',
        emissive: '#F4A460',
        emissiveIntensity: 0.1,
        roughness: 0.8,
        metalness: 0.0,
        opacity: 1.0,
        wireframe: false,
        visible: true,
      },
    },
    water: {
      color: '#2196f3',
      opacity: 0.85,
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
  return THEMES[id] as Theme | undefined;
};

export const getDefaultTheme = (): Theme => {
  return THEMES['golden'] as Theme;
};

export const getAllThemes = (): Theme[] => {
  return Object.values(THEMES);
};

export default THEMES;
