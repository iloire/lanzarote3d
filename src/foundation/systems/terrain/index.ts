/**
 * Procedural Terrain Generation System
 * Generates parametric terrain meshes with noise-based displacement
 */

export { ProceduralTerrainGenerator, type TerrainConfig, type TerrainType, type NoiseMode, type TerrainMetadata } from './ProceduralTerrainGenerator';
export { TERRAIN_PRESETS, getPreset, getPresetNames, getPresetWithOverrides, createPresetMaterial, getPresetDescription } from './TerrainPresets';
export { PerlinNoise, SimplexNoise, FractalNoise, type NoiseType, type FractalNoiseOptions } from './noise';