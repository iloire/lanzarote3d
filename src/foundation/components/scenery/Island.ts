import * as THREE from 'three';
import Models from '../../utils/models';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { TerrainTheme } from '../../types/Theme';
import { logger } from '../../utils/logger';
import { addCloudShadows } from '../../rendering/shaderChunks';
import { bakeFaceShading } from '../../rendering/faceShading';
import { GroundRegion, bakeRegionTint } from '../../rendering/regionTint';

THREE.Mesh.prototype.raycast = acceleratedRaycast;

const loadFromBlenderModel = async (model: string, manager: THREE.LoadingManager) => {
  const object = await Models.loadSimple(model, manager);
  const mesh = object as THREE.Mesh;
  // The GLB carries positions only (3d/slim-glb.py), so the lines are flat-shaded too.
  mesh.material = new THREE.MeshStandardMaterial({
    wireframe: true,
    depthTest: true,
    flatShading: true,
  });
  addCloudShadows(mesh.material);
  addLineFade(mesh.material);
  mesh.geometry.boundsTree = new MeshBVH(mesh.geometry);
  return mesh;
};

// Distances (world units) over which the wireframe fades from near to far opacity.
const LINE_FADE_START = 600;
const LINE_FADE_END = 9000;
// Brightest the lines get (linear, before tone mapping): a light grey, not a glare.
const LINE_MAX_BRIGHTNESS = 0.9;

type LineFade = { uLineNear: { value: number }; uLineFar: { value: number } };

/**
 * Let the GL-line wireframe fade with distance. Far away the mesh is so dense that solid
 * lines merge into a white sheet. Only themes without an underlay draw these lines; with
 * one, the underlay shades the wireframe itself and shares these fade uniforms.
 */
const addLineFade = (material: THREE.Material): void => {
  const fade: LineFade = { uLineNear: { value: 1 }, uLineFar: { value: 1 } };
  material.userData['lineFade'] = fade;
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous.call(material, shader, renderer);
    Object.assign(shader.uniforms, fade);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uLineNear;\nuniform float uLineFar;'
      )
      .replace(
        '#include <opaque_fragment>',
        `// Lines are lit far past white before tone mapping; at any opacity that still blends
        // to white. Cap their brightness first so the opacity reads as intended.
        float lzPeak = max(max(outgoingLight.r, outgoingLight.g), outgoingLight.b);
        outgoingLight *= min(1.0, ${LINE_MAX_BRIGHTNESS.toFixed(2)} / max(lzPeak, 1e-4));
        diffuseColor.a *= mix(uLineNear, uLineFar,
          smoothstep(${LINE_FADE_START.toFixed(1)}, ${LINE_FADE_END.toFixed(1)}, length(vLzWorld - cameraPosition)));
        #include <opaque_fragment>`
      );
  };
};

// Width of the wireframe drawn by the underlay, in device pixels.
const LINE_WIDTH_PX = 1.0;

/**
 * The underlay's copy of the island: one vertex per triangle corner, each tagged with a
 * barycentric coordinate, so the fragment shader knows how far it is from every edge.
 */
const toBarycentricGeometry = (
  geometry: THREE.BufferGeometry,
  regions: GroundRegion[],
  toWorld: THREE.Matrix4
): THREE.BufferGeometry => {
  const ground = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const count = ground.getAttribute('position').count;
  const bary = new Uint8Array(count * 3);
  for (let i = 0; i < count; i++) bary[i * 3 + (i % 3)] = 1;
  ground.setAttribute('lzBarycentric', new THREE.BufferAttribute(bary, 3, true));
  ground.setAttribute('lzFace', bakeFaceShading(ground));
  ground.setAttribute('lzRegion', bakeRegionTint(ground, regions, toWorld));
  return ground;
};

// How much flat faces brighten and steep ones darken, and how much each face's tone
// is jittered, when the theme doesn't say.
const DEFAULT_SLOPE_SHADE = 0.25;
const DEFAULT_FACE_JITTER = 0.12;

/**
 * The solid ground, which also draws the wireframe. Each triangle is flat-lit and one
 * colour: tinted from beach to peak by its centre height, recoloured by the region it sits in
 * (volcanic, green or desert; see bakeRegionTint), lighter when level, darker when
 * steep, and jittered a little so neighbours differ (see bakeFaceShading). The lines are
 * shaded into it from barycentric coordinates rather than drawn as GL
 * lines: 350k line segments into the 4x multisampled scene target cost more than the
 * rest of the frame put together. The lines fade with distance from `lineFade`.
 *
 * Every vertex is pushed a fraction further along its view ray, so roads and anything
 * else drawn on the ground stay in front of it (polygon offset doesn't work with the
 * logarithmic depth buffer).
 */
const createUnderlay = (
  geometry: THREE.BufferGeometry,
  lineFade: LineFade,
  regions: GroundRegion[],
  toWorld: THREE.Matrix4
): THREE.Mesh => {
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.95,
    metalness: 0,
    flatShading: true,
  });
  material.userData['peakColor'] = { value: new THREE.Color() };
  material.userData['sandColor'] = { value: new THREE.Color() };
  material.userData['lineColor'] = { value: new THREE.Color() };
  material.userData['lineEmissive'] = { value: new THREE.Color() };
  material.userData['facet'] = {
    value: new THREE.Vector2(DEFAULT_SLOPE_SHADE, DEFAULT_FACE_JITTER),
  };
  material.onBeforeCompile = shader => {
    shader.uniforms['uPeakColor'] = material.userData['peakColor'];
    shader.uniforms['uSandColor'] = material.userData['sandColor'];
    shader.uniforms['uLineColor'] = material.userData['lineColor'];
    shader.uniforms['uLineEmissive'] = material.userData['lineEmissive'];
    shader.uniforms['uFacet'] = material.userData['facet'];
    Object.assign(shader.uniforms, lineFade);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vLzHeight;\nattribute vec3 lzBarycentric;\nvarying vec3 vLzBary;\nattribute vec3 lzFace;\nvarying vec2 vLzFace;\nattribute vec4 lzRegion;\nvarying vec4 vLzRegion;'
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        // The face's centre height, so the whole triangle takes one tint.
        vLzHeight = (modelMatrix * vec4(transformed.x, lzFace.x, transformed.z, 1.0)).y;
        vLzBary = lzBarycentric;
        vLzFace = lzFace.yz;
        vLzRegion = lzRegion;
        mvPosition.xyz *= 1.003;
        gl_Position = projectionMatrix * mvPosition;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vLzHeight;
        varying vec3 vLzBary;
        varying vec2 vLzFace;
        varying vec4 vLzRegion;
        uniform vec2 uFacet;
        uniform vec3 uPeakColor;
        uniform vec3 uSandColor;
        uniform vec3 uLineColor;
        uniform vec3 uLineEmissive;
        uniform float uLineNear;
        uniform float uLineFar;`
      )
      .replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `vec3 lzGround = mix( diffuse, uPeakColor, smoothstep( 60.0, 650.0, vLzHeight ) );
        lzGround = mix( lzGround, vLzRegion.rgb, vLzRegion.a );
        lzGround = mix( uSandColor, lzGround, smoothstep( 4.0, 30.0, vLzHeight ) );
        float lzSteep = 1.0 - smoothstep( 0.7, 0.98, vLzFace.x );
        lzGround *= ( 1.0 + uFacet.x * ( 1.0 - 2.0 * lzSteep ) ) * ( 1.0 + uFacet.y * vLzFace.y );
        // Coverage of the nearest triangle edge, anti-aliased over one pixel.
        vec3 lzEdge = smoothstep( vec3( 0.0 ), fwidth( vLzBary ) * ${LINE_WIDTH_PX.toFixed(1)}, vLzBary );
        float lzLine = ( 1.0 - min( min( lzEdge.x, lzEdge.y ), lzEdge.z ) ) * mix( uLineNear, uLineFar,
          smoothstep( ${LINE_FADE_START.toFixed(1)}, ${LINE_FADE_END.toFixed(1)}, length( vLzWorld - cameraPosition ) ) );
        vec4 diffuseColor = vec4( mix( lzGround, uLineColor, lzLine ), opacity );`
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uLineEmissive * lzLine;'
      );
  };
  material.customProgramCacheKey = () => 'lz-underlay';
  addCloudShadows(material);

  const underlay = new THREE.Mesh(toBarycentricGeometry(geometry, regions, toWorld), material);
  underlay.name = 'island-underlay';
  underlay.castShadow = true;
  underlay.receiveShadow = true;
  underlay.raycast = () => {};
  return underlay;
};

class Island {
  private mesh: THREE.Mesh | null = null;
  private underlay: THREE.Mesh | null = null;
  private regions: GroundRegion[] = [];
  /**
   * Load the terrain mesh from a location's GLB (positions and triangles only, see 3d/slim-glb.py)
   */
  async load(model: string, manager: THREE.LoadingManager): Promise<THREE.Mesh> {
    this.mesh = await loadFromBlenderModel(model, manager);
    return this.mesh;
  }

  /**
   * Colour patches of ground by region. Baked when the underlay is built, so call it
   * before the theme is applied, once the island is placed in the scene.
   */
  setRegions(regions: GroundRegion[]): void {
    this.regions = regions;
  }

  /**
   * Apply terrain theme styling to the island mesh
   */
  async applyTheme(terrainTheme: TerrainTheme): Promise<void> {
    if (!this.mesh || !this.mesh.material) {
      logger.warn('Island mesh not loaded - cannot apply theme');
      return;
    }

    logger.debug('Applying terrain theme to island:', terrainTheme);

    // Handle regular material themes
    const material = this.mesh.material as THREE.MeshStandardMaterial;

    // Apply custom material properties if provided
    if (terrainTheme.customMaterial) {
      const custom = terrainTheme.customMaterial;

      // Color
      if (custom.color) {
        material.color = new THREE.Color(custom.color);
      }

      // Emissive properties
      if (custom.emissive) {
        material.emissive = new THREE.Color(custom.emissive);
      }
      if (custom.emissiveIntensity !== undefined) {
        material.emissiveIntensity = custom.emissiveIntensity;
      }

      // Surface properties
      if (custom.roughness !== undefined) {
        material.roughness = custom.roughness;
      }
      if (custom.metalness !== undefined) {
        material.metalness = custom.metalness;
      }

      // Transparency and wireframe
      if (custom.opacity !== undefined) {
        material.opacity = custom.opacity;
        material.transparent = custom.opacity < 1.0 || custom.transparent === true;
      }
      if (custom.transparent !== undefined) {
        material.transparent = custom.transparent;
      }
      if (custom.wireframe !== undefined) {
        material.wireframe = custom.wireframe;
      }

      // Displacement (if supported by geometry)
      if (custom.displacementScale !== undefined) {
        material.displacementScale = custom.displacementScale;
      }
      if (custom.displacementBias !== undefined) {
        material.displacementBias = custom.displacementBias;
      }

      // Visibility
      if (custom.visible !== undefined) {
        this.mesh.visible = custom.visible;
      }

      // Force material update
      material.needsUpdate = true;
    }

    this.setUnderlay(terrainTheme.underlay);

    logger.debug('Island terrain theme applied successfully');
  }

  /**
   * Show, recolour or remove the solid ground. While it's shown, it draws the wireframe
   * too, and the island's own line material is hidden.
   */
  private setUnderlay(underlay: TerrainTheme['underlay']): void {
    if (!this.mesh) return;
    const lines = this.mesh.material as THREE.MeshStandardMaterial;
    const fade: LineFade | undefined = lines.userData['lineFade'];
    if (!underlay || !fade) {
      lines.visible = true;
      if (fade) {
        fade.uLineNear.value = 1;
        fade.uLineFar.value = 1;
      }
      if (this.underlay) {
        this.mesh.remove(this.underlay);
        (this.underlay.material as THREE.Material).dispose();
        this.underlay.geometry.dispose();
        this.underlay = null;
      }
      return;
    }
    // A theme without wireframe gets plain ground: the line opacity drops to zero.
    fade.uLineNear.value = lines.wireframe ? (underlay.lineOpacity ?? 0.45) : 0;
    fade.uLineFar.value = lines.wireframe ? (underlay.farLineOpacity ?? 0.12) : 0;
    lines.visible = !lines.wireframe;
    if (!this.underlay) {
      this.mesh.updateMatrixWorld(true);
      this.underlay = createUnderlay(this.mesh.geometry, fade, this.regions, this.mesh.matrixWorld);
      this.mesh.add(this.underlay);
    }
    const material = this.underlay.material as THREE.MeshStandardMaterial;
    material.color.set(underlay.color);
    material.userData['peakColor'].value.set(underlay.peakColor ?? underlay.color);
    material.userData['sandColor'].value.set(underlay.sandColor ?? underlay.color);
    material.userData['facet'].value.set(
      underlay.slopeShade ?? DEFAULT_SLOPE_SHADE,
      underlay.faceJitter ?? DEFAULT_FACE_JITTER
    );
    material.userData['lineColor'].value.copy(lines.color);
    material.userData['lineEmissive'].value
      .copy(lines.emissive)
      .multiplyScalar(lines.emissiveIntensity);
  }

  /**
   * Get the current mesh (for external theme application)
   */
  getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.mesh) {
      if (this.mesh.material instanceof THREE.Material) {
        this.mesh.material.dispose();
      }
      if (this.mesh.geometry) {
        this.mesh.geometry.dispose();
      }
    }
  }
}

export { Island };
