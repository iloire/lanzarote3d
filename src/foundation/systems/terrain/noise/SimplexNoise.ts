/**
 * Simplex Noise Generator
 * Faster and has fewer directional artifacts than Perlin noise
 * Based on Stefan Gustavson's implementation
 */
export class SimplexNoise {
  private perm: Uint8Array;
  private permMod12: Uint8Array;

  // Simplex skewing and unskewing factors
  private readonly F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  private readonly G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

  // Gradient vectors for 2D
  private readonly grad3 = [
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1],
  ];

  constructor(seed: number = Math.random()) {
    // Initialize permutation table with seed
    const p = this.generatePermutation(seed);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);

    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  /**
   * Generate seeded permutation table
   */
  private generatePermutation(seed: number): Uint8Array {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Seeded shuffle
    let random = seed;
    const lcg = () => {
      random = (random * 1664525 + 1013904223) % 4294967296;
      return random / 4294967296;
    };

    for (let i = 255; i > 0; i--) {
      const j = Math.floor(lcg() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    return p;
  }

  /**
   * Calculate dot product for 2D
   */
  private dot2(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y;
  }

  /**
   * Generate 2D Simplex noise
   * Returns value in approximate range [-1, 1]
   */
  noise2D(xin: number, yin: number): number {
    let n0, n1, n2; // Noise contributions from the three corners

    // Skew the input space to determine which simplex cell we're in
    const s = (xin + yin) * this.F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * this.G2;

    // Unskew the cell origin back to (x,y) space
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0; // The x,y distances from the cell origin
    const y0 = yin - Y0;

    // Determine which simplex we are in
    let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }

    // Offsets for middle corner in (x,y) unskewed coords
    const x1 = x0 - i1 + this.G2;
    const y1 = y0 - j1 + this.G2;
    // Offsets for last corner in (x,y) unskewed coords
    const x2 = x0 - 1.0 + 2.0 * this.G2;
    const y2 = y0 - 1.0 + 2.0 * this.G2;

    // Work out the hashed gradient indices of the three simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];

    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
      n0 = 0.0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot2(this.grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
      n1 = 0.0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot2(this.grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
      n2 = 0.0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot2(this.grad3[gi2], x2, y2);
    }

    // Add contributions from each corner to get the final noise value
    // The result is scaled to return values in the interval [-1,1]
    return 70.0 * (n0 + n1 + n2);
  }

  /**
   * Generate normalized noise in range [0, 1]
   */
  noise2DNormalized(x: number, y: number): number {
    return (this.noise2D(x, y) + 1) * 0.5;
  }
}