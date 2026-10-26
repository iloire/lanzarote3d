import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { Sky as SkyExample } from 'three/examples/jsm/objects/Sky';
import { sharedUniforms } from './sharedUniforms';
import { AtmosphereTheme } from '../types/Theme';

/** The filmic look, all of it overridable per theme (theme.atmosphere). */
export const DEFAULT_ATMOSPHERE: Required<Omit<AtmosphereTheme, 'fogColor'>> = {
  exposure: 0.72,
  fogDensity: 0.000026,
  bloomStrength: 0.3,
  bloomRadius: 0.6,
  bloomThreshold: 1.2,
  vignette: 0.35,
  saturation: 1.12,
  contrast: 1.06,
  warmth: 0.04,
  cloudShadow: 0.25,
};

// Adaptive quality: when frames run long, shed MSAA samples first and then pixel ratio;
// recover in the reverse order when they don't.
const SLOW_FRAME_MS = 22;
const FAST_FRAME_MS = 17.5;
const DPR_STEP = 0.25;
const DPR_CHECK_MS = 1500;
const DPR_RAISE_COOLDOWN_MS = 10000;

// MSAA samples for a pixel ratio. From 1.5x up the pixels are small enough that 2x
// smooths the edges, and on a Retina screen samples cost more than pixels: 4x took
// ~7.5 ms of a 25 ms frame at 2880x1800 on an M3 Pro, 2x about half that.
const samplesFor = (pixelRatio: number): number => (pixelRatio >= 1.5 ? 2 : 4);

// The sun's shadow covers a box this size round the camera instead of the whole island.
const SHADOW_BOX = 3000;

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uVignette: { value: DEFAULT_ATMOSPHERE.vignette },
    uSaturation: { value: DEFAULT_ATMOSPHERE.saturation },
    uContrast: { value: DEFAULT_ATMOSPHERE.contrast },
    uWarmth: { value: DEFAULT_ATMOSPHERE.warmth },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Runs after OutputPass, so it works on display (sRGB) values.
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uWarmth;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = c.rgb;
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, uSaturation);
      col = (col - 0.5) * uContrast + 0.5;
      // Warm the highlights, keep the shadows cool: a volcanic, late-afternoon cast.
      col += vec3(uWarmth, uWarmth * 0.35, -uWarmth) * smoothstep(0.25, 1.0, luma);
      vec2 d = vUv - 0.5;
      col *= 1.0 - uVignette * smoothstep(0.25, 0.85, dot(d, d) * 2.2);
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
    }
  `,
};

/**
 * Draws the scene into its own multisampled target (see samplesFor), then copies the resolved image
 * into the composer's chain. Only this pass pays for MSAA; giving the composer's
 * ping-pong buffers samples made every full-screen pass resolve too, which doubled the
 * frame time on an M3 Pro.
 */
class MsaaScenePass extends Pass {
  camera: THREE.Camera;
  private readonly target: THREE.WebGLRenderTarget;
  // Copies the resolved scene on, dropping NaN/Inf and clamping blow-outs: one bad
  // pixel (a half-float overflow in a specular highlight) would otherwise be smeared
  // into a black hole across the frame by the bloom blur.
  private readonly copy = new FullScreenQuad(
    new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
          vec4 c = texture2D(tDiffuse, vUv);
          if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0, 0.0, 0.0, 1.0);
          gl_FragColor = vec4(clamp(c.rgb, 0.0, 32.0), c.a);
        }
      `,
    })
  );

  constructor(
    private readonly scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    super();
    this.camera = camera;
    this.needsSwap = false;
    this.target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  }

  override setSize(width: number, height: number): void {
    this.target.setSize(width, height);
  }

  get samples(): number {
    return this.target.samples;
  }

  set samples(samples: number) {
    if (samples === this.target.samples) return;
    this.target.samples = samples;
    // The GPU buffers are rebuilt with the new sample count on next use.
    this.target.dispose();
  }

  override render(
    renderer: THREE.WebGLRenderer,
    _writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ): void {
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    (this.copy.material as THREE.ShaderMaterial).uniforms['tDiffuse']!.value = this.target.texture;
    renderer.setRenderTarget(readBuffer);
    this.copy.render(renderer);
  }

  override dispose(): void {
    this.target.dispose();
    this.copy.dispose();
    (this.copy.material as THREE.Material).dispose();
  }
}

interface SkySource {
  sky: SkyExample;
  directionalLight: THREE.DirectionalLight;
  getSunPosition(): THREE.Vector3;
  setHaze(color: THREE.Color, strength: number): void;
  setLensflareVisible(visible: boolean): void;
}

/**
 * Renders the terrain scenes through a filmic pipeline: ACES tone mapping, MSAA, bloom
 * on the sun and the glints, a colour grade with vignette, an environment map lit by
 * the sky, fog matched to the horizon, a shadow box that follows the camera, and a
 * pixel ratio that adapts to how long frames take.
 */
export class RenderPipeline {
  private readonly composer: EffectComposer;
  private readonly renderPass: MsaaScenePass;
  private readonly bloomPass: UnrealBloomPass;
  private readonly gradePass: ShaderPass;
  private readonly clock = new THREE.Clock();
  private readonly pmrem: THREE.PMREMGenerator;
  private envTarget: THREE.WebGLRenderTarget | null = null;
  private sky: SkySource | null = null;
  private atmosphere: AtmosphereTheme = {};

  private readonly maxPixelRatio: number;
  private pixelRatio: number;
  private frameMsAverage = 16.7;
  private lastDprCheck = 0;
  private lastDprDrop = -Infinity;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
    camera: THREE.Camera,
    options: { maxPixelRatio?: number } = {}
  ) {
    this.maxPixelRatio = Math.min(window.devicePixelRatio, options.maxPixelRatio ?? 2);
    this.pixelRatio = this.maxPixelRatio;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = DEFAULT_ATMOSPHERE.exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // The composer renders several passes a frame; count the whole frame, not the last pass.
    renderer.info.autoReset = false;

    const size = renderer.getSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType });
    this.composer = new EffectComposer(renderer, target);

    this.renderPass = new MsaaScenePass(scene, camera);
    this.renderPass.samples = samplesFor(this.pixelRatio);
    this.bloomPass = new UnrealBloomPass(
      size.clone().multiplyScalar(0.5),
      DEFAULT_ATMOSPHERE.bloomStrength,
      DEFAULT_ATMOSPHERE.bloomRadius,
      DEFAULT_ATMOSPHERE.bloomThreshold
    );
    this.gradePass = new ShaderPass(GradeShader);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(new OutputPass());
    this.composer.addPass(this.gradePass);
    this.composer.setPixelRatio(this.pixelRatio);
    this.composer.setSize(size.x, size.y);

    this.pmrem = new THREE.PMREMGenerator(renderer);
    window.addEventListener('resize', this.onResize);
  }

  /** Hook the sky up: it lights the environment map, the fog and the shadow box. */
  attachSky(sky: SkySource): void {
    this.sky = sky;
    sky.setLensflareVisible(false);
    this.scene.add(sky.directionalLight.target);
    const shadowCamera = sky.directionalLight.shadow.camera as THREE.OrthographicCamera;
    shadowCamera.left = -SHADOW_BOX;
    shadowCamera.right = SHADOW_BOX;
    shadowCamera.top = SHADOW_BOX;
    shadowCamera.bottom = -SHADOW_BOX;
    shadowCamera.near = 100;
    shadowCamera.far = 60000;
    shadowCamera.updateProjectionMatrix();
    // Shadows from the sun let skylight in: soft grey, not black holes in the ground.
    sky.directionalLight.shadow.intensity = 0.55;
    sky.directionalLight.shadow.bias = -0.0005;
    this.refreshSky();
  }

  /** Apply a theme's look; call refreshSky() as well when the sun has moved. */
  applyAtmosphere(atmosphere: AtmosphereTheme = {}): void {
    this.atmosphere = atmosphere;
    const a = { ...DEFAULT_ATMOSPHERE, ...atmosphere };
    this.renderer.toneMappingExposure = a.exposure;
    this.bloomPass.strength = a.bloomStrength;
    this.bloomPass.radius = a.bloomRadius;
    this.bloomPass.threshold = a.bloomThreshold;
    const u = this.gradePass.uniforms as typeof GradeShader.uniforms;
    u.uVignette.value = a.vignette;
    u.uSaturation.value = a.saturation;
    u.uContrast.value = a.contrast;
    u.uWarmth.value = a.warmth;
    sharedUniforms.uCloudShadow.value = a.cloudShadow;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = a.fogDensity;
    }
    this.refreshSky();
  }

  /**
   * Re-light from the sky after the sun moves: a fresh environment map, and fog and
   * horizon haze in the colour the sky has at the horizon.
   */
  refreshSky(): void {
    if (!this.sky) return;
    const envScene = new THREE.Scene();
    const envSky = new SkyExample();
    envSky.material = this.sky.sky.material;
    envSky.scale.setScalar(50);
    envScene.add(envSky);
    this.envTarget?.dispose();
    this.envTarget = this.pmrem.fromScene(envScene, 0, 0.1, 1000);
    this.scene.environment = this.envTarget.texture;
    this.scene.environmentIntensity = 0.6;

    this.sky.setHaze(new THREE.Color(), 0);
    const horizon = this.atmosphere.fogColor
      ? new THREE.Color(this.atmosphere.fogColor)
      : this.sampleHorizon(envScene);
    const density = this.atmosphere.fogDensity ?? DEFAULT_ATMOSPHERE.fogDensity;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(horizon);
      this.scene.fog.density = density;
    } else {
      this.scene.fog = new THREE.FogExp2(horizon, density);
    }
    this.sky.setHaze(horizon, 1);
  }

  /** Average sky colour a few degrees above the horizon, looking across the sun. */
  private sampleHorizon(envScene: THREE.Scene): THREE.Color {
    const fallback = new THREE.Color(0.55, 0.65, 0.78);
    if (!this.sky) return fallback;
    const size = 16;
    const target = new THREE.WebGLRenderTarget(size, size, { type: THREE.FloatType });
    const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 1000);
    const sun = this.sky.getSunPosition();
    const across = new THREE.Vector3(-sun.z, 0, sun.x);
    if (across.lengthSq() < 1e-6) across.set(1, 0, 0);
    across.normalize();
    camera.lookAt(across.x, Math.tan(THREE.MathUtils.degToRad(3)), across.z);
    const previous = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(target);
    this.renderer.render(envScene, camera);
    const pixels = new Float32Array(size * size * 4);
    try {
      this.renderer.readRenderTargetPixels(target, 0, 0, size, size, pixels);
    } catch {
      return fallback;
    } finally {
      this.renderer.setRenderTarget(previous);
      target.dispose();
    }
    const sum = new THREE.Vector3();
    for (let i = 0; i < size * size; i++) {
      sum.x += pixels[i * 4]!;
      sum.y += pixels[i * 4 + 1]!;
      sum.z += pixels[i * 4 + 2]!;
    }
    sum.divideScalar(size * size);
    if (!Number.isFinite(sum.x) || sum.length() === 0) return fallback;
    return new THREE.Color(sum.x, sum.y, sum.z);
  }

  render(camera: THREE.Camera): void {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    sharedUniforms.uTime.value += delta;
    this.adaptQuality(delta * 1000);
    this.followShadow(camera);
    this.renderPass.camera = camera;
    this.renderer.info.reset();
    this.composer.render(delta);
  }

  private followShadow(camera: THREE.Camera): void {
    if (!this.sky) return;
    const light = this.sky.directionalLight;
    const focus = light.target.position;
    // Centre the box a little ahead of the camera, on the ground.
    camera.getWorldDirection(_forward);
    focus.set(camera.position.x + _forward.x * 800, 0, camera.position.z + _forward.z * 800);
    // Snap to whole shadow texels so the edges don't crawl as the camera moves.
    const texel = (SHADOW_BOX * 2) / light.shadow.mapSize.x;
    focus.x = Math.round(focus.x / texel) * texel;
    focus.z = Math.round(focus.z / texel) * texel;
    light.position.copy(this.sky.getSunPosition()).multiplyScalar(30000).add(focus);
    light.target.updateMatrixWorld();
  }

  private adaptQuality(frameMs: number): void {
    this.frameMsAverage += (frameMs - this.frameMsAverage) * 0.05;
    const now = performance.now();
    if (now - this.lastDprCheck < DPR_CHECK_MS) return;
    this.lastDprCheck = now;
    const samples = this.renderPass.samples;
    if (this.frameMsAverage > SLOW_FRAME_MS) {
      if (samples > 0) {
        this.renderPass.samples = samples > 2 ? 2 : 0;
      } else if (this.pixelRatio > 1) {
        this.setPixelRatio(Math.max(1, this.pixelRatio - DPR_STEP));
      } else {
        return;
      }
      this.lastDprDrop = now;
    } else if (
      this.frameMsAverage < FAST_FRAME_MS &&
      now - this.lastDprDrop > DPR_RAISE_COOLDOWN_MS
    ) {
      if (this.pixelRatio < this.maxPixelRatio) {
        this.setPixelRatio(Math.min(this.maxPixelRatio, this.pixelRatio + DPR_STEP));
      } else if (samples < samplesFor(this.pixelRatio)) {
        this.renderPass.samples = samples === 0 ? 2 : 4;
      }
    }
  }

  private setPixelRatio(pixelRatio: number): void {
    this.pixelRatio = pixelRatio;
    this.renderer.setPixelRatio(pixelRatio);
    this.composer.setPixelRatio(pixelRatio);
  }

  getStats(): { pixelRatio: number; samples: number; frameMs: number } {
    return {
      pixelRatio: this.pixelRatio,
      samples: this.renderPass.samples,
      frameMs: this.frameMsAverage,
    };
  }

  private onResize = (): void => {
    this.composer.setSize(window.innerWidth, window.innerHeight);
  };

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.composer.dispose();
    this.bloomPass.dispose();
    this.envTarget?.dispose();
    this.pmrem.dispose();
  }
}

const _forward = new THREE.Vector3();
