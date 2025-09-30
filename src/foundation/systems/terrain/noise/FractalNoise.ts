import { PerlinNoise } from './PerlinNoise';
import { SimplexNoise } from './SimplexNoise';

export type NoiseType = 'perlin' | 'simplex';

export interface FractalNoiseOptions {
  noiseType?: NoiseType;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
  scale?: number;
  seed?: number;
}

/**
 * Fractal Noise Generator
 * Combines multiple octaves of noise for rich, detailed terrain
 * Also known as Fractal Brownian Motion (fBm)
 */
export class FractalNoise {
  private noiseGenerator: PerlinNoise | SimplexNoise;
  private octaves: number;
  private persistence: number;
  private lacunarity: number;
  private scale: number;

  constructor(options: FractalNoiseOptions = {}) {
    const {
      noiseType = 'simplex',
      octaves = 4,
      persistence = 0.5,
      lacunarity = 2.0,
      scale = 1.0,
      seed = Math.random(),
    } = options;

    this.octaves = octaves;
    this.persistence = persistence;
    this.lacunarity = lacunarity;
    this.scale = scale;

    // Initialize noise generator based on type
    if (noiseType === 'perlin') {
      this.noiseGenerator = new PerlinNoise(seed);
    } else {
      this.noiseGenerator = new SimplexNoise(seed);
    }
  }

  /**
   * Generate 2D fractal noise by layering multiple octaves
   * Returns value in approximate range [-1, 1]
   */
  noise2D(x: number, y: number): number {
    let total = 0;
    let frequency = this.scale;
    let amplitude = 1;
    let maxValue = 0; // Used for normalizing result to [-1, 1]

    for (let i = 0; i < this.octaves; i++) {
      total += this.noiseGenerator.noise2D(x * frequency, y * frequency) * amplitude;

      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return total / maxValue;
  }

  /**
   * Generate normalized noise in range [0, 1]
   */
  noise2DNormalized(x: number, y: number): number {
    return (this.noise2D(x, y) + 1) * 0.5;
  }

  /**
   * Generate ridge noise (inverted absolute value)
   * Great for mountain ridges and sharp features
   */
  ridgeNoise2D(x: number, y: number): number {
    let total = 0;
    let frequency = this.scale;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < this.octaves; i++) {
      const noise = this.noiseGenerator.noise2D(x * frequency, y * frequency);
      // Take absolute value and invert to create ridges
      total += (1 - Math.abs(noise)) * amplitude;

      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return (total / maxValue) * 2 - 1; // Normalize to [-1, 1]
  }

  /**
   * Generate turbulence noise (absolute values)
   * Creates chaotic, turbulent patterns
   */
  turbulence2D(x: number, y: number): number {
    let total = 0;
    let frequency = this.scale;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < this.octaves; i++) {
      total += Math.abs(this.noiseGenerator.noise2D(x * frequency, y * frequency)) * amplitude;

      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return (total / maxValue) * 2 - 1; // Normalize to [-1, 1]
  }

  /**
   * Generate billowy noise (squared values)
   * Creates soft, cloud-like formations
   */
  billow2D(x: number, y: number): number {
    let total = 0;
    let frequency = this.scale;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < this.octaves; i++) {
      const noise = this.noiseGenerator.noise2D(x * frequency, y * frequency);
      total += Math.pow(Math.abs(noise), 2) * amplitude;

      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return (total / maxValue) * 2 - 1; // Normalize to [-1, 1]
  }

  /**
   * Update generator parameters
   */
  setOctaves(octaves: number): void {
    this.octaves = octaves;
  }

  setPersistence(persistence: number): void {
    this.persistence = persistence;
  }

  setLacunarity(lacunarity: number): void {
    this.lacunarity = lacunarity;
  }

  setScale(scale: number): void {
    this.scale = scale;
  }
}