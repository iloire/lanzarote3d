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
  // A solid surface drawn just behind the wireframe so the island reads as ground.
  underlay?: {
    color: string; // The bulk of the island
    peakColor?: string; // Blended in with altitude
    sandColor?: string; // Beaches, the last few metres above the sea
    lineOpacity?: number; // Wireframe opacity close to the camera (default 0.45)
    farLineOpacity?: number; // ...fading to this far away, where the mesh gets dense (default 0.12)
  };
}

export interface WaterTheme {
  color: string;
  opacity: number;
  shallowColor?: string; // Turquoise over the sand near the beaches
  shallowDistance?: number; // How far out the shallows reach, in world units
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

/**
 * The filmic look of the terrain scenes (see RenderPipeline). Every field is optional;
 * missing ones fall back to DEFAULT_ATMOSPHERE.
 */
export interface AtmosphereTheme {
  exposure?: number; // Tone-mapping exposure
  fogColor?: string; // Defaults to the sky's own colour at the horizon
  fogDensity?: number; // FogExp2 density; ~0.00003 fades the far end of the island
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number; // Linear brightness above which pixels glow
  vignette?: number; // 0 = none
  saturation?: number; // 1 = unchanged
  contrast?: number; // 1 = unchanged
  warmth?: number; // Warm highlights / cool shadows, 0 = neutral
  cloudShadow?: number; // Strength of drifting cloud shadows, 0-1
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
  atmosphere?: AtmosphereTheme;
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
