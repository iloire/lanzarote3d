import * as THREE from 'three';
import { TerrainConfig } from './ProceduralTerrainGenerator';

/**
 * Predefined terrain configurations for common landscape types
 */

export const TERRAIN_PRESETS: Record<string, TerrainConfig> = {
  // Alpine Mountains - Tall peaks with sharp ridges
  mountains: {
    terrainType: 'mountains',
    noiseType: 'simplex',
    noiseMode: 'ridge',
    heightScale: 2000,
    heightBias: -500,
    octaves: 6,
    persistence: 0.5,
    lacunarity: 2.2,
    scale: 0.0003,
    segments: 250,
    color: 0x8b7355,
  },

  // Rolling Hills - Gentle, smooth elevation changes
  hills: {
    terrainType: 'hills',
    noiseType: 'simplex',
    noiseMode: 'standard',
    heightScale: 500,
    heightBias: 0,
    octaves: 4,
    persistence: 0.6,
    lacunarity: 2.0,
    scale: 0.0008,
    segments: 150,
    color: 0x4a7c59,
  },

  // Flat Plains - Minimal variation, mostly flat
  flat: {
    terrainType: 'flat',
    noiseType: 'simplex',
    noiseMode: 'standard',
    heightScale: 50,
    heightBias: 0,
    octaves: 2,
    persistence: 0.3,
    lacunarity: 2.0,
    scale: 0.001,
    segments: 100,
    color: 0x6b8e23,
  },

  // Deep Canyon - Dramatic valleys and cliffs
  canyon: {
    terrainType: 'canyon',
    noiseType: 'simplex',
    noiseMode: 'ridge',
    heightScale: 1500,
    heightBias: -800,
    octaves: 5,
    persistence: 0.55,
    lacunarity: 2.3,
    scale: 0.0004,
    segments: 200,
    color: 0xc19a6b,
  },

  // Desert Dunes - Smooth, wavy sand formations
  desert: {
    terrainType: 'desert',
    noiseType: 'perlin',
    noiseMode: 'billow',
    heightScale: 400,
    heightBias: 0,
    octaves: 3,
    persistence: 0.7,
    lacunarity: 1.8,
    scale: 0.0006,
    segments: 180,
    color: 0xf4a460,
  },

  // Tropical Island - Raised center with coastal falloff
  island: {
    terrainType: 'island',
    noiseType: 'simplex',
    noiseMode: 'standard',
    heightScale: 800,
    heightBias: -200,
    octaves: 5,
    persistence: 0.5,
    lacunarity: 2.1,
    scale: 0.0005,
    islandFalloff: 0.8,
    segments: 200,
    color: 0x2e8b57,
  },

  // Plateau - Flat-topped mesas
  plateau: {
    terrainType: 'plateau',
    noiseType: 'simplex',
    noiseMode: 'standard',
    heightScale: 1000,
    heightBias: 0,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.0005,
    plateauHeight: 0.6,
    segments: 180,
    color: 0xcd853f,
  },

  // Valleys - Deep depressions between hills
  valleys: {
    terrainType: 'valleys',
    noiseType: 'simplex',
    noiseMode: 'standard',
    heightScale: 800,
    heightBias: -400,
    octaves: 5,
    persistence: 0.5,
    lacunarity: 2.0,
    scale: 0.0006,
    segments: 180,
    color: 0x556b2f,
  },

  // Volcanic - Rough, chaotic terrain with sharp features
  volcanic: {
    terrainType: 'mountains',
    noiseType: 'simplex',
    noiseMode: 'turbulence',
    heightScale: 1800,
    heightBias: -400,
    octaves: 6,
    persistence: 0.6,
    lacunarity: 2.5,
    scale: 0.0004,
    segments: 220,
    color: 0x8b4513,
  },

  // Arctic Tundra - Low, rolling ice formations
  arctic: {
    terrainType: 'hills',
    noiseType: 'simplex',
    noiseMode: 'billow',
    heightScale: 300,
    heightBias: 0,
    octaves: 4,
    persistence: 0.4,
    lacunarity: 2.0,
    scale: 0.0007,
    segments: 150,
    color: 0xe0ffff,
  },

  // Badlands - Eroded, layered terrain
  badlands: {
    terrainType: 'canyon',
    noiseType: 'perlin',
    noiseMode: 'ridge',
    heightScale: 1200,
    heightBias: -300,
    octaves: 7,
    persistence: 0.45,
    lacunarity: 2.4,
    scale: 0.0005,
    segments: 220,
    color: 0xd2691e,
  },

  // Alien World - Extreme, otherworldly terrain
  alien: {
    terrainType: 'mountains',
    noiseType: 'simplex',
    noiseMode: 'turbulence',
    heightScale: 3000,
    heightBias: 0,
    octaves: 8,
    persistence: 0.7,
    lacunarity: 3.0,
    scale: 0.0002,
    segments: 250,
    color: 0x9370db,
  },
};

/**
 * Get preset configuration by name
 */
export function getPreset(name: string): TerrainConfig | undefined {
  return TERRAIN_PRESETS[name];
}

/**
 * Get all preset names
 */
export function getPresetNames(): string[] {
  return Object.keys(TERRAIN_PRESETS);
}

/**
 * Get preset with custom overrides
 */
export function getPresetWithOverrides(
  name: string,
  overrides: Partial<TerrainConfig>
): TerrainConfig | undefined {
  const preset = TERRAIN_PRESETS[name];
  if (!preset) return undefined;

  return { ...preset, ...overrides };
}

/**
 * Create a custom material for a preset
 */
export function createPresetMaterial(presetName: string): THREE.Material {
  const preset = TERRAIN_PRESETS[presetName];
  if (!preset || !preset.color) {
    return new THREE.MeshStandardMaterial({
      color: 0x4a7c59,
      roughness: 0.8,
      metalness: 0.2,
    });
  }

  // Special materials for specific presets
  switch (presetName) {
    case 'arctic':
      return new THREE.MeshStandardMaterial({
        color: preset.color,
        roughness: 0.1,
        metalness: 0.4,
        emissive: 0x4169e1,
        emissiveIntensity: 0.2,
      });

    case 'volcanic':
      return new THREE.MeshStandardMaterial({
        color: preset.color,
        roughness: 0.9,
        metalness: 0.1,
        emissive: 0xff4500,
        emissiveIntensity: 0.1,
      });

    case 'alien':
      return new THREE.MeshStandardMaterial({
        color: preset.color,
        roughness: 0.5,
        metalness: 0.5,
        emissive: 0x00ff7f,
        emissiveIntensity: 0.3,
      });

    case 'desert':
      return new THREE.MeshStandardMaterial({
        color: preset.color,
        roughness: 0.9,
        metalness: 0.0,
      });

    default:
      return new THREE.MeshStandardMaterial({
        color: preset.color,
        roughness: 0.8,
        metalness: 0.2,
      });
  }
}

/**
 * Get preset description
 */
export function getPresetDescription(name: string): string {
  const descriptions: Record<string, string> = {
    mountains: 'Tall alpine peaks with sharp ridges and dramatic elevation',
    hills: 'Gentle rolling hills with smooth transitions',
    flat: 'Minimal variation, mostly level terrain',
    canyon: 'Deep valleys with dramatic cliffs and erosion',
    desert: 'Smooth sand dunes with gentle waves',
    island: 'Raised landmass with coastal falloff',
    plateau: 'Flat-topped mesas with steep sides',
    valleys: 'Deep depressions between elevated areas',
    volcanic: 'Rough, chaotic terrain with sharp volcanic features',
    arctic: 'Low rolling ice formations and frozen tundra',
    badlands: 'Eroded layered terrain with complex patterns',
    alien: 'Extreme otherworldly landscape with unusual formations',
  };

  return descriptions[name] || 'Custom terrain configuration';
}