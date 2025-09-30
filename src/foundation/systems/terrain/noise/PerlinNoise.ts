/**
 * Perlin Noise Generator
 * Classic smooth noise algorithm for natural-looking terrain
 * Based on Ken Perlin's improved noise algorithm
 */
export class PerlinNoise {
  private permutation: number[];
  private p: number[];

  constructor(seed: number = Math.random()) {
    // Initialize permutation table with seed
    this.permutation = this.generatePermutation(seed);
    this.p = [...this.permutation, ...this.permutation];
  }

  /**
   * Generate seeded permutation table
   */
  private generatePermutation(seed: number): number[] {
    const p = Array.from({ length: 256 }, (_, i) => i);

    // Seeded shuffle using simple LCG
    let random = seed;
    const lcg = () => {
      random = (random * 1664525 + 1013904223) % 4294967296;
      return random / 4294967296;
    };

    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(lcg() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    return p;
  }

  /**
   * Fade function for smooth interpolation
   */
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Linear interpolation
   */
  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  /**
   * Calculate gradient
   */
  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * Generate 3D Perlin noise value at coordinates
   * Returns value in range [-1, 1]
   */
  noise3D(x: number, y: number, z: number): number {
    // Find unit cube containing point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    // Find relative position in cube
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    // Compute fade curves
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    // Hash coordinates of cube corners
    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    // Blend results from cube corners
    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))
      ),
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.p[AA + 1], x, y, z - 1),
          this.grad(this.p[BA + 1], x - 1, y, z - 1)
        ),
        this.lerp(
          u,
          this.grad(this.p[AB + 1], x, y - 1, z - 1),
          this.grad(this.p[BB + 1], x - 1, y - 1, z - 1)
        )
      )
    );
  }

  /**
   * Generate 2D Perlin noise (optimized for terrain heightmaps)
   * Returns value in range [-1, 1]
   */
  noise2D(x: number, y: number): number {
    return this.noise3D(x, y, 0);
  }

  /**
   * Generate normalized noise in range [0, 1]
   */
  noise2DNormalized(x: number, y: number): number {
    return (this.noise2D(x, y) + 1) * 0.5;
  }
}