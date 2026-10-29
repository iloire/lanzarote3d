/** A tide's range and pace, as a location JSON gives it (see src/locations/README.md) */
export interface TideConfig {
  /** Low and high water, metres above mean sea level */
  low: number;
  high: number;
  /** Seconds from one low water to the next */
  period: number;
  /** Share of the period the water rises for (0.5 is symmetric; less, a faster flood) */
  flood: number;
}

/**
 * A time-compressed tide: the water follows a cosine between low and high water, warped so the
 * flood takes `flood` of each period and the ebb the rest. Its phase runs 0 (low water) to π
 * (high water) to 2π (low water again), so shaders can work out from the phase alone how long
 * ago the ebbing water left a patch of sand.
 */
export class Tide {
  readonly mid: number;
  readonly amplitude: number;

  constructor(readonly config: TideConfig) {
    this.mid = (config.high + config.low) / 2;
    this.amplitude = (config.high - config.low) / 2;
  }

  /** Phase at `seconds`, 0 to 2π: flood from 0 to π, ebb from π to 2π */
  phase(seconds: number): number {
    const { period, flood } = this.config;
    const u = (((seconds / period) % 1) + 1) % 1;
    return u < flood ? (Math.PI * u) / flood : Math.PI + (Math.PI * (u - flood)) / (1 - flood);
  }

  /** Water level at a phase, metres */
  levelAt(phase: number): number {
    return this.mid - this.amplitude * Math.cos(phase);
  }

  /** Water level at `seconds`, metres */
  level(seconds: number): number {
    return this.levelAt(this.phase(seconds));
  }

  /** True while the water comes in */
  rising(seconds: number): boolean {
    return this.phase(seconds) < Math.PI;
  }

  /** How far from low (0) to high (1) water the tide stands */
  fullness(seconds: number): number {
    return (1 - Math.cos(this.phase(seconds))) / 2;
  }

  /**
   * How long ago, as phase, the ebb left ground `height` metres high: 0 while it is under water
   * or the water is just leaving, up to 2π for ground the sea never reaches. Mirrors the shader.
   */
  dryFor(height: number, phase: number): number {
    if (height >= this.config.high) return Math.PI * 2;
    if (height <= this.config.low) return 0;
    // The flood reaches this height at `wet`, the ebb leaves it at 2π - wet
    const wet = Math.acos((this.mid - height) / this.amplitude);
    if (phase >= wet && phase <= Math.PI * 2 - wet) return 0;
    return phase > Math.PI ? phase - (Math.PI * 2 - wet) : phase + wet;
  }

  /** Seconds until the tide is next at `phase` */
  secondsUntil(phase: number, seconds: number): number {
    const { period, flood } = this.config;
    const at = (p: number) =>
      p < Math.PI ? (p / Math.PI) * flood : flood + ((p - Math.PI) / Math.PI) * (1 - flood);
    const now = at(this.phase(seconds));
    return ((((at(phase) - now) % 1) + 1) % 1) * period;
  }
}
