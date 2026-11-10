import * as THREE from 'three';

/** Christmas colours, mostly gold and white, past white so the bloom makes them glow */
const GLOW = 3;
const COLOURS = ['#ffd85a', '#ffd85a', '#fff6e0', '#fff6e0', '#ff4a4a', '#5aff8a'].map(hex =>
  new THREE.Color(hex).multiplyScalar(GLOW)
);

export interface SparkleTrailOptions {
  /** Sparkles a second while emitting */
  rate?: number;
  /** Seconds each lasts */
  life?: number;
  /** A sparkle's size, in world units */
  size?: number;
  /** How far, in world units, they scatter round the point they're left at */
  spread?: number;
}

/**
 * A trail of twinkling sparkles left in the air behind whatever calls `update` with its position
 * while `emitting`. Each hangs where it was left, drifts down a little, twinkles and fades. The
 * sparkles are a ring of points written as they're born and animated in the shader: one draw
 * call, and a few attributes written a frame.
 */
export class SparkleTrail {
  readonly points: THREE.Points;
  private readonly now = { value: 0 };
  private readonly rate: number;
  private readonly spread: number;
  private readonly count: number;
  private readonly position: THREE.BufferAttribute;
  private readonly birth: THREE.BufferAttribute;
  private readonly colour: THREE.BufferAttribute;
  private next = 0;
  private owed = 0;

  constructor(options: SparkleTrailOptions = {}) {
    this.rate = options.rate ?? 60;
    const life = options.life ?? 4;
    this.spread = options.spread ?? 1;
    this.count = Math.ceil(this.rate * life) + 8;

    const geometry = new THREE.BufferGeometry();
    this.position = new THREE.BufferAttribute(new Float32Array(this.count * 3), 3);
    // Born long ago, so every sparkle starts dead
    this.birth = new THREE.BufferAttribute(new Float32Array(this.count).fill(-1e6), 1);
    this.colour = new THREE.BufferAttribute(new Float32Array(this.count * 3), 3);
    [this.position, this.birth, this.colour].forEach(a => a.setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('position', this.position);
    geometry.setAttribute('lzBirth', this.birth);
    geometry.setAttribute('color', this.colour);

    const material = new THREE.PointsMaterial({
      size: options.size ?? 0.5,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    material.onBeforeCompile = shader => {
      shader.uniforms['uNow'] = this.now;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform float uNow;
          attribute float lzBirth;
          varying float vLzGlow;`
        )
        .replace(
          '#include <begin_vertex>',
          `float lzAge = uNow - lzBirth;
          float lzLife = clamp( lzAge / ${life.toFixed(2)}, 0.0, 1.0 );
          vec3 transformed = position - vec3( 0.0, lzAge * 0.6, 0.0 );
          // Bright when born, twinkling as it fades, gone at the end of its life
          vLzGlow = ( 1.0 - lzLife ) * step( lzAge, ${life.toFixed(2)} )
            * ( 0.55 + 0.45 * sin( lzAge * 18.0 + lzBirth * 97.0 ) );`
        )
        .replace('gl_PointSize = size;', 'gl_PointSize = size * ( 0.6 + 0.8 * vLzGlow );');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vLzGlow;')
        .replace(
          '#include <alphatest_fragment>',
          `// A soft round spark
          vec2 lzSpot = gl_PointCoord - 0.5;
          diffuseColor.a *= vLzGlow * smoothstep( 0.5, 0.1, length( lzSpot ) );
          #include <alphatest_fragment>`
        );
    };
    material.customProgramCacheKey = () => 'lz-sparkle-trail';

    this.points = new THREE.Points(geometry, material);
    this.points.name = 'sparkle-trail';
    // They're spread along wherever the emitter has been
    this.points.frustumCulled = false;
  }

  /** Advance the clock; while `emitting`, leave sparkles round `at` (world space) */
  update(deltaTime: number, at: THREE.Vector3, emitting: boolean): void {
    this.now.value += deltaTime;
    if (!emitting) {
      this.owed = 0;
      return;
    }
    this.owed += deltaTime * this.rate;
    let born = false;
    for (; this.owed >= 1; this.owed--) {
      const i = this.next;
      this.next = (this.next + 1) % this.count;
      const s = this.spread;
      this.position.setXYZ(
        i,
        at.x + (Math.random() - 0.5) * s,
        at.y + (Math.random() - 0.5) * s,
        at.z + (Math.random() - 0.5) * s
      );
      // Spread over the frame, so a slow frame doesn't leave its sparkles in a clump
      this.birth.setX(i, this.now.value - Math.random() * deltaTime);
      const colour = COLOURS[Math.floor(Math.random() * COLOURS.length)]!;
      this.colour.setXYZ(i, colour.r, colour.g, colour.b);
      born = true;
    }
    if (born) [this.position, this.birth, this.colour].forEach(a => (a.needsUpdate = true));
  }

  dispose(): void {
    this.points.removeFromParent();
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
