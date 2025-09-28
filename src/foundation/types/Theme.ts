// import * as THREE from 'three';

export interface SkyTheme {
  timeOfDay: number; // 0-24 hours
  sunIntensity?: number;
  directionalLight?: {
    intensity?: number;
    color?: string;
    castShadow?: boolean;
    shadowMapSize?: number;
    shadowCamera?: {
      near?: number;
      far?: number;
      left?: number;
      right?: number;
      top?: number;
      bottom?: number;
    };
  };
  fogEnabled?: boolean; // Whether to apply fog at all
  fogColor?: string;
  fogDensity?: number;
}

export interface CloudTheme {
  colors: string[];
  density?: number;
  scale?: number;
  opacity?: number;
}

export interface StaticSatelliteConfig {
  // Pre-downloaded satellite imagery configuration
  textureAtlas: string; // Path to bundled texture atlas
  tileMap: string; // Path to tile mapping configuration JSON
  attribution?: string;
  source?: 'openstreetmap' | 'esri' | 'custom';
  resolution?: number; // Meters per pixel
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface SatelliteImageryConfig {
  enabled: boolean;
  mode: 'static' | 'dynamic'; // Static for pre-downloaded, dynamic for API fetching
  staticConfig?: StaticSatelliteConfig;
  blendMode?: 'multiply' | 'overlay' | 'screen' | 'normal';
  opacity?: number;
  fallbackToWireframe?: boolean;
  uvMapping?: {
    offsetU: number;
    offsetV: number;
    scaleU: number;
    scaleV: number;
  };
}

export interface TerrainTheme {
  style:
    | 'volcanic'
    | 'arctic'
    | 'desert'
    | 'alien'
    | 'crystal'
    | 'wireframe'
    | 'plasma'
    | 'satellite';
  satelliteImagery?: SatelliteImageryConfig;
  customMaterial?: {
    color?: string;
    emissive?: string;
    emissiveIntensity?: number;
    roughness?: number;
    metalness?: number;
    opacity?: number;
    transparent?: boolean;
    wireframe?: boolean;
    displacementScale?: number;
    displacementBias?: number;
    visible?: boolean;
  };
}

export interface WaterTheme {
  color: string;
  opacity: number;
  roughness?: number;
  animated?: boolean;
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
  enabled?: boolean;

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
  skipComponents?: Array<
    'sky' | 'clouds' | 'terrain' | 'water' | 'weather' | 'ambient' | 'environment'
  >;
}

export default Theme;
