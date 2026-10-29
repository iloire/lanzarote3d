import * as THREE from 'three';

/** A rooftop the beams shine from: world position and how many beams */
export interface LaserSite {
  at: THREE.Vector3;
  beams: number;
}

const COLOURS = ['#30ff6a', '#2fd9ff', '#ff3ad1', '#ffffff', '#4a6bff'];
/** World units a beam reaches, and how wide it gets at its end */
const LENGTH = 9000;
const SPREAD = 22;
// How bright a beam is at its root (linear)
const BRIGHTNESS = 1.6;
// Seconds the show runs, and then rests
const ON = 50;
const OFF = 25;

const FADE = /* glsl */ `
  float along = vUv.y;
  float fade = pow( 1.0 - along, 2.2 ) * smoothstep( 0.0, 0.01, along );
  float edge = 1.0 - abs( vUv.x * 2.0 - 1.0 );
  diffuseColor.rgb *= fade * edge * ${BRIGHTNESS.toFixed(2)} * uShow;
`;

/**
 * A light show like the harbour's Symphony of Lights: thin beams from the tops of the towers,
 * sweeping slowly across the sky in step, fading out along their length. Each beam is an open
 * cone added on top of the scene (one draw call each, a handful in all).
 */
export class LightShow {
  readonly group = new THREE.Group();
  private readonly beams: { mesh: THREE.Mesh; sweep: number; tilt: number; speed: number }[] = [];
  private readonly show = { value: 1 };
  private time = 0;

  constructor(sites: LaserSite[]) {
    this.group.name = 'light-show';
    // A cone from its tip at the origin up +y; uv.y runs from 0 at the root to 1 at the end
    const geometry = new THREE.CylinderGeometry(SPREAD, 0.5, LENGTH, 6, 1, true).translate(
      0,
      LENGTH / 2,
      0
    );
    let n = 0;
    sites.forEach(site => {
      for (let k = 0; k < site.beams; k++, n++) {
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(COLOURS[n % COLOURS.length]!),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          fog: false,
        });
        material.onBeforeCompile = shader => {
          shader.uniforms['uShow'] = this.show;
          // The cone's uv, which a plain colour doesn't otherwise get
          shader.vertexShader = `#define USE_UV\n${shader.vertexShader}`;
          shader.fragmentShader = `#define USE_UV\n${shader.fragmentShader}`
            .replace('#include <common>', '#include <common>\nuniform float uShow;')
            .replace('#include <color_fragment>', `#include <color_fragment>\n${FADE}`);
        };
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(site.at);
        mesh.frustumCulled = false;
        mesh.renderOrder = 2;
        this.group.add(mesh);
        this.beams.push({
          mesh,
          sweep: (k / site.beams) * Math.PI * 2 + n,
          tilt: 0.55 + 0.25 * Math.sin(n * 1.7),
          speed: 0.18 + 0.06 * Math.sin(n * 2.3),
        });
      }
    });
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    const cycle = this.time % (ON + OFF);
    // Fade in and out over a couple of seconds either end
    this.show.value = Math.min(
      THREE.MathUtils.smoothstep(cycle, 0, 2),
      1 - THREE.MathUtils.smoothstep(cycle, ON - 2, ON)
    );
    this.group.visible = this.show.value > 0.001;
    this.beams.forEach(({ mesh, sweep, tilt, speed }) => {
      const heading = sweep + Math.sin(this.time * speed) * 1.2;
      mesh.rotation.set(tilt + Math.sin(this.time * speed * 1.3) * 0.25, heading, 0, 'YXZ');
    });
  }

  dispose(): void {
    this.beams.forEach(({ mesh }) => (mesh.material as THREE.Material).dispose());
    this.beams[0]?.mesh.geometry.dispose();
  }
}
