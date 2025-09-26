import { Theme } from '../types/Theme';

export const THEMES: Record<string, Theme> = {
  sunset: {
    id: 'sunset',
    name: 'Sunset Romance',
    description: 'Warm evening colors with romantic pink and golden tones',
    category: 'atmospheric',
    sky: {
      timeOfDay: 19,
      sunIntensity: 2.3,
      fogColor: '#ff6b6b',
      fogDensity: 0.003,
    },
    clouds: {
      colors: ['#F64A8A', '#F987C5', '#DE3163'],
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
    description: 'Warm golden light perfect for photography and peaceful moments',
    category: 'atmospheric',
    sky: {
      timeOfDay: 17.5,
      sunIntensity: 2.0,
      fogColor: '#ffd54f',
      fogDensity: 0.002,
    },
    clouds: {
      colors: ['#FFD700', '#FFA500', '#FF8C00'],
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
    description: 'Cold, crisp environment with icy blue tones and pristine snow',
    category: 'nature',
    sky: {
      timeOfDay: 14,
      sunIntensity: 1.8,
      fogColor: '#e3f2fd',
      fogDensity: 0.001,
    },
    clouds: {
      colors: ['#FFFAFA', '#F8F8FF', '#F5F5F5'],
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
    description: 'Dark and moody atmosphere with dramatic storm clouds',
    category: 'atmospheric',
    sky: {
      timeOfDay: 15,
      sunIntensity: 1.2,
      fogColor: '#37474f',
      fogDensity: 0.005,
    },
    clouds: {
      colors: ['#2F2F2F', '#4A4A4A', '#F5F5F5'],
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

  ethereal: {
    id: 'ethereal',
    name: 'Ethereal Blue',
    description: 'Mystical and dreamlike with soft blue and purple tones',
    category: 'fantasy',
    sky: {
      timeOfDay: 20,
      sunIntensity: 1.6,
      fogColor: '#e1f5fe',
      fogDensity: 0.002,
    },
    clouds: {
      colors: ['#87CEEB', '#B0E0E6', '#F0F8FF'],
      density: 0.9,
      opacity: 0.7,
    },
    terrain: {
      style: 'crystal',
      customMaterial: {
        roughness: 0.0,
        metalness: 0.1,
      },
    },
    water: {
      color: '#4fc3f7',
      opacity: 0.75,
      waveIntensity: 0.3,
    },
    weather: {
      windDirectionDegreesFromNorth: 180,
      speedMetresPerSecond: 4,
      lclLevel: 1900,
    },
    ambient: {
      lightingIntensity: 1.0,
      shadowIntensity: 0.5,
    },
  },

  autumn: {
    id: 'autumn',
    name: 'Autumn Mist',
    description: 'Warm autumn colors with misty atmosphere',
    category: 'season',
    sky: {
      timeOfDay: 16,
      sunIntensity: 1.8,
      fogColor: '#d7ccc8',
      fogDensity: 0.004,
    },
    clouds: {
      colors: ['#CD853F', '#DEB887', '#F5DEB3'],
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

  alien: {
    id: 'alien',
    name: 'Alien World',
    description: 'Otherworldly terrain with exotic materials and alien atmosphere',
    category: 'sci-fi',
    sky: {
      timeOfDay: 12,
      sunIntensity: 2.5,
      fogColor: '#4a148c',
      fogDensity: 0.003,
    },
    clouds: {
      colors: ['#9932CC', '#00FF7F', '#FF1493'],
      density: 1.1,
      opacity: 0.8,
    },
    terrain: {
      style: 'alien',
      customMaterial: {
        emissiveIntensity: 1.0,
        metalness: 0.8,
      },
    },
    water: {
      color: '#e91e63',
      opacity: 0.7,
      waveIntensity: 0.8,
    },
    weather: {
      windDirectionDegreesFromNorth: 90,
      speedMetresPerSecond: 7,
      lclLevel: 2200,
    },
    ambient: {
      lightingIntensity: 1.3,
      shadowIntensity: 0.4,
      backgroundColor: '#1a0a2e',
    },
  },

  plasma: {
    id: 'plasma',
    name: 'Plasma Energy',
    description: 'High-energy environment with dynamic plasma effects',
    category: 'sci-fi',
    sky: {
      timeOfDay: 22,
      sunIntensity: 2.8,
      fogColor: '#ff0080',
      fogDensity: 0.002,
    },
    clouds: {
      colors: ['#FF00FF', '#FF1493', '#8A2BE2'],
      density: 1.0,
      opacity: 0.9,
    },
    terrain: {
      style: 'plasma',
      customMaterial: {
        emissiveIntensity: 1.5,
        metalness: 0.6,
      },
    },
    water: {
      color: '#ff4081',
      opacity: 0.8,
      animated: true,
      waveIntensity: 1.0,
    },
    weather: {
      windDirectionDegreesFromNorth: 135,
      speedMetresPerSecond: 9,
      lclLevel: 2500,
    },
    ambient: {
      lightingIntensity: 1.5,
      shadowIntensity: 0.3,
      backgroundColor: '#0d0221',
      particleEffects: true,
    },
  },

  matrix: {
    id: 'matrix',
    name: 'Digital Matrix',
    description: 'Cyberpunk wireframe environment with glowing digital aesthetics',
    category: 'sci-fi',
    sky: {
      timeOfDay: 0,
      sunIntensity: 0.5,
      fogColor: '#003300',
      fogDensity: 0.001,
    },
    clouds: {
      colors: ['#00FF00', '#00CC00', '#008800'],
      density: 0.5,
      opacity: 0.6,
    },
    terrain: {
      style: 'wireframe',
      customMaterial: {
        emissiveIntensity: 1.0,
      },
    },
    water: {
      color: '#00ff41',
      opacity: 0.3,
      waveIntensity: 0.1,
    },
    weather: {
      windDirectionDegreesFromNorth: 0,
      speedMetresPerSecond: 1,
      lclLevel: 3000,
    },
    ambient: {
      lightingIntensity: 0.5,
      shadowIntensity: 2.0,
      backgroundColor: '#000000',
    },
  },

  natural: {
    id: 'natural',
    name: 'Natural Famara',
    description: 'Clean, natural environment perfect for showcasing landscape beauty',
    category: 'nature',
    sky: {
      timeOfDay: 13,
      sunIntensity: 2.2,
      fogColor: '#f5f5f5',
      fogDensity: 0.001,
    },
    clouds: {
      colors: ['#ffffff', '#f0f8ff', '#e6f3ff'],
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
export const getThemesByCategory = (category: string): Theme[] => {
  return Object.values(THEMES).filter(theme => theme.category === category);
};

export const getThemeById = (id: string): Theme | undefined => {
  return THEMES[id];
};

export const getAllThemes = (): Theme[] => {
  return Object.values(THEMES);
};

export const getThemeCategories = (): string[] => {
  const categories = new Set(Object.values(THEMES).map(theme => theme.category).filter(Boolean));
  return Array.from(categories) as string[];
};

export default THEMES;