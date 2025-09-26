import * as THREE from 'three';

export interface SkyTheme {
  timeOfDay: number; // 0-24 hours
  sunIntensity?: number;
  fogColor?: string;
  fogDensity?: number;
}

export interface CloudTheme {
  colors: string[];
  density?: number;
  scale?: number;
  opacity?: number;
}

export interface TerrainTheme {
  style: 'volcanic' | 'arctic' | 'desert' | 'alien' | 'crystal' | 'wireframe' | 'plasma';
  customMaterial?: {
    color?: string;
    emissive?: string;
    emissiveIntensity?: number;
    roughness?: number;
    metalness?: number;
    displacementScale?: number;
    displacementBias?: number;
  };
}

export interface WaterTheme {
  color: string;
  opacity: number;
  roughness?: number;
  animated?: boolean;
  waveIntensity?: number;
}

export interface WeatherTheme {
  windDirectionDegreesFromNorth: number;
  speedMetresPerSecond: number;
  lclLevel: number;
}

export interface AmbientTheme {
  lightingIntensity?: number;
  backgroundColor?: string;
  particleEffects?: boolean;
  shadowIntensity?: number;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  category?: 'nature' | 'fantasy' | 'sci-fi' | 'atmospheric' | 'season';

  // Core environmental components
  sky: SkyTheme;
  clouds: CloudTheme;
  terrain: TerrainTheme;
  water: WaterTheme;
  weather: WeatherTheme;
  ambient?: AmbientTheme;
}

// Helper type for partial theme overrides
export type PartialTheme = Partial<Theme> & { id: string };

// Theme application options
export interface ThemeApplicationOptions {
  preserveCamera?: boolean;
  animateTransition?: boolean;
  transitionDuration?: number;
  skipComponents?: Array<'sky' | 'clouds' | 'terrain' | 'water' | 'weather' | 'ambient'>;
}

export default Theme;