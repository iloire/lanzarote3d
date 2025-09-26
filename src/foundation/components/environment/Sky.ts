import * as THREE from 'three';
import { Sky as SkyExample } from 'three/examples/jsm/objects/Sky';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import lensflareTexture0 from '../../../../assets/foundation/textures/effects/lensflare0.png';
import lensflareTexture1 from '../../../../assets/foundation/textures/effects/lensflare1.png';
import Time from '../../utils/time';
import GuiHelper from '../../utils/gui';

// ============================================================================
// LIGHTING SYSTEM CONFIGURATION
// ============================================================================

/**
 * Light intensity values for different times of day
 * These values affect all three light types: ambient, point, and directional
 * Higher values = brighter lighting overall
 */
const LIGHT_INTENSITY_BY_HOUR = {
  0: 1.8,   // Midnight - dim
  6: 1.8,   // Dawn - dim
  10: 2.0,  // Morning - brightening
  12: 2.2,  // Noon - bright
  14: 2.5,  // Afternoon - peak brightness
  16: 2.4,  // Late afternoon - still bright
  18: 2.2,  // Evening - dimming
  20: 2.3,  // Sunset - warm lighting (optimized)
  21: 2.1,  // Night - darker
  24: 1.8,  // Late night - dim
};

/**
 * Lighting multipliers - adjust these to change the relative intensity of each light type
 */
const LIGHTING_CONFIG = {
  // Point light (sun) - Direct sun lighting with lens flare
  POINT_LIGHT_INTENSITY: 2.1,

  // Directional light (main scene lighting) - Primary light for objects and shadows
  DIRECTIONAL_LIGHT_MULTIPLIER: 2.5,  // Multiply base intensity by this
  DIRECTIONAL_LIGHT_UPDATE_MULTIPLIER: 2.3,  // For position updates

  // Ambient light - Background illumination (no shadows)
  // Uses base intensity directly (multiplier = 1.0)

  // Shadow configuration
  SHADOW_MAP_SIZE: 2048,  // Default shadow quality
  SHADOW_CAMERA_SIZE: 10000,  // Shadow area coverage
};

/**
 * Calculate light intensity based on time of day
 */
const calculateLightIntensity = (timeOfDayInHours: number): number => {
  // Find the closest hour values for interpolation
  const hours = Object.keys(LIGHT_INTENSITY_BY_HOUR).map(Number).sort((a, b) => a - b);

  for (let i = 0; i < hours.length; i++) {
    const hour = hours[i]!;
    if (timeOfDayInHours <= hour) {
      const prevHour = hours[i - 1] ?? hours[hours.length - 1]!;
      const nextHour = hour;

      // Linear interpolation between hours
      const t = (timeOfDayInHours - prevHour) / (nextHour - prevHour);
      const prevIntensity = LIGHT_INTENSITY_BY_HOUR[prevHour as keyof typeof LIGHT_INTENSITY_BY_HOUR]!;
      const nextIntensity = LIGHT_INTENSITY_BY_HOUR[nextHour as keyof typeof LIGHT_INTENSITY_BY_HOUR]!;

      return prevIntensity + (nextIntensity - prevIntensity) * t;
    }
  }

  // Fallback to last value
  return LIGHT_INTENSITY_BY_HOUR[24];
};

/**
 * Calculate sun position in 3D space based on time of day
 */
const calculateSunPosition = (timeOfDayInHours: number): THREE.Vector3 => {
  const sunPosition = new THREE.Vector3();

  // Elevation angle (how high the sun is)
  const phi = THREE.MathUtils.degToRad(
    -1 * Time.getSunAltitudeDegreesAccordingToTimeOfDay(timeOfDayInHours)
  );

  // Azimuth angle (direction around the horizon)
  const theta = THREE.MathUtils.degToRad(
    Time.getSunAzimuthDegreesAccordingToTimeOfDay(timeOfDayInHours)
  );

  sunPosition.setFromSphericalCoords(1, phi, theta);
  return sunPosition;
};

// ============================================================================
// SKY ATMOSPHERE CONFIGURATION
// ============================================================================

type SkyOptions = {
  turbidity: number;      // Atmospheric thickness/haziness (0-10)
  rayleigh: number;       // Rayleigh scattering (blue sky) (0-4)
  mieCoefficient: number; // Mie scattering (sun disk) (0-0.1)
  mieDirectionalG: number; // Sun direction influence (0-1)
};

const DEFAULT_SKY_OPTIONS: SkyOptions = {
  turbidity: 0.8,        // Slight haze
  rayleigh: 0.03,        // Natural blue sky
  mieCoefficient: 0.005, // Subtle sun disk
  mieDirectionalG: 0.8,  // Strong directional lighting
};

// ============================================================================
// SKY CLASS - MANAGES LIGHTING AND ATMOSPHERE
// ============================================================================

/**
 * Sky system that manages:
 * 1. Three.js Sky atmosphere
 * 2. Three lighting sources (point, directional, ambient)
 * 3. Sun position and time-based lighting
 * 4. Theme-based lighting overrides
 */
export default class Sky extends THREE.Object3D {
  // Sun and sky
  sunPosition: THREE.Vector3;
  monthOfTheYear: number;
  sky: SkyExample;
  skyOptions: SkyOptions;

  // Lighting system - THREE LIGHT SOURCES
  ambientLight: THREE.AmbientLight;      // 1. Background illumination (no shadows)
  pointLight: THREE.PointLight;          // 2. Sun light with lens flare (distant)
  directionalLight: THREE.DirectionalLight; // 3. Main scene lighting (shadows)

  // Debug helpers
  directionalLightHelper!: THREE.DirectionalLightHelper;

  constructor(timeOfDayInHours: number, monthOfTheYear: number, skyOptions?: SkyOptions) {
    super();

    // Initialize sun position and time
    this.sunPosition = calculateSunPosition(timeOfDayInHours);
    this.monthOfTheYear = monthOfTheYear;
    this.skyOptions = { ...DEFAULT_SKY_OPTIONS, ...skyOptions };

    // Initialize sky atmosphere
    this.initializeSkyAtmosphere();

    // Initialize lighting system
    this.initializeLighting(timeOfDayInHours);
  }

  // ============================================================================
  // INITIALIZATION METHODS
  // ============================================================================

  /**
   * Initialize the Three.js Sky atmosphere
   */
  private initializeSkyAtmosphere(): void {
    this.sky = new SkyExample();
    this.sky.material.uniforms['sunPosition']?.value?.copy(this.sunPosition);
    this.sky.scale.setScalar(10000000);

    // Apply sky options to uniforms
    const skyUniforms = this.sky.material.uniforms;
    for (const key in this.skyOptions) {
      if (skyUniforms[key]) {
        skyUniforms[key].value = this.skyOptions[key];
      } else {
        console.warn(`Sky uniform '${key}' not found`);
      }
    }
  }

  /**
   * Initialize all three light sources with proper configuration
   */
  private initializeLighting(timeOfDayInHours: number): void {
    const baseIntensity = calculateLightIntensity(timeOfDayInHours);

    // 1. POINT LIGHT - Sun with lens flare (distant light source)
    this.pointLight = new THREE.PointLight(
      0xffffff,
      LIGHTING_CONFIG.POINT_LIGHT_INTENSITY,
      0 // Infinite range
    );
    this.pointLight.castShadow = true;
    this.pointLight.color.setHSL(0.995, 0.5, 0.9); // Warm sunlight color
    this.pointLight.position.copy(this.sunPosition.clone().multiplyScalar(1000000));

    // 2. DIRECTIONAL LIGHT - Main scene lighting with shadows
    const directionalIntensity = baseIntensity * LIGHTING_CONFIG.DIRECTIONAL_LIGHT_MULTIPLIER;
    this.directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
    this.directionalLight.castShadow = true;
    this.directionalLight.position.copy(this.sunPosition.clone().multiplyScalar(100000));

    // Configure shadows
    this.setupDirectionalLightShadows();

    // 3. AMBIENT LIGHT - Background illumination (no shadows)
    this.ambientLight = new THREE.AmbientLight(0xffffff, baseIntensity);

    // Optional: Enable helper for debugging
    // this.directionalLightHelper = new THREE.DirectionalLightHelper(this.directionalLight, 1000);
  }

  /**
   * Configure directional light shadow settings
   */
  private setupDirectionalLightShadows(): void {
    if (!this.directionalLight.shadow) return;

    // Shadow map quality
    this.directionalLight.shadow.mapSize.width = LIGHTING_CONFIG.SHADOW_MAP_SIZE;
    this.directionalLight.shadow.mapSize.height = LIGHTING_CONFIG.SHADOW_MAP_SIZE;

    // Shadow camera bounds (orthographic camera for directional light)
    const camera = this.directionalLight.shadow.camera as THREE.OrthographicCamera;
    const size = LIGHTING_CONFIG.SHADOW_CAMERA_SIZE;
    camera.left = -size;
    camera.right = size;
    camera.top = size;
    camera.bottom = -size;
    camera.near = 0.5;
    camera.far = 50000;
    camera.updateProjectionMatrix();
  }

  // ============================================================================
  // PUBLIC METHODS - SCENE INTEGRATION
  // ============================================================================

  /**
   * Add all sky and lighting components to the scene
   */
  addToScene(scene: THREE.Scene): void {
    // Add sky atmosphere
    scene.add(this.sky);

    // Add all three light sources
    scene.add(this.directionalLight);
    scene.add(this.pointLight);
    scene.add(this.ambientLight);

    // Add lens flare to sun
    this.addLensFlareToSun();

    // Optional: Add debug helpers
    if (this.directionalLightHelper) {
      scene.add(this.directionalLightHelper);
    }
  }

  /**
   * Update sun position and all lighting for a new time of day
   */
  updateSunPosition(timeOfDayInHours: number): void {
    // Calculate new sun position
    this.sunPosition = calculateSunPosition(timeOfDayInHours);
    const baseIntensity = calculateLightIntensity(timeOfDayInHours);

    // Update sky atmosphere
    this.sky.material.uniforms['sunPosition']?.value?.copy(this.sunPosition);

    // Update point light (sun)
    this.pointLight.position.copy(this.sunPosition.clone().multiplyScalar(10000));
    this.pointLight.intensity = LIGHTING_CONFIG.POINT_LIGHT_INTENSITY;

    // Update directional light (main scene lighting)
    this.directionalLight.position.copy(this.sunPosition.clone().multiplyScalar(10000));
    this.directionalLight.intensity = baseIntensity * LIGHTING_CONFIG.DIRECTIONAL_LIGHT_UPDATE_MULTIPLIER;

    // Update ambient light
    this.ambientLight.intensity = baseIntensity;

    // Update debug helper if enabled
    if (this.directionalLightHelper) {
      this.directionalLightHelper.update();
    }
  }

  /**
   * Get current sun position
   */
  getSunPosition(): THREE.Vector3 {
    return this.sunPosition;
  }

  // ============================================================================
  // VISUAL EFFECTS
  // ============================================================================

  /**
   * Add lens flare effect to the sun (point light)
   */
  private addLensFlareToSun(): void {
    const textureLoader = new THREE.TextureLoader();
    const textureFlare0 = textureLoader.load(lensflareTexture0);
    const textureFlare1 = textureLoader.load(lensflareTexture1);

    const lensflare = new Lensflare();
    const flareSize = 600;

    // Main flare element (bright center)
    lensflare.addElement(new LensflareElement(textureFlare0, flareSize, 0, this.pointLight.color));

    // Secondary flare element (ghosting effect)
    lensflare.addElement(new LensflareElement(textureFlare1, flareSize, 0.6));

    // Additional flare elements can be added for more complex effects:
    // lensflare.addElement(new LensflareElement(textureFlare1, flareSize, 0.7));
    // lensflare.addElement(new LensflareElement(textureFlare1, flareSize, 0.9));

    this.pointLight.add(lensflare);
  }

  // ============================================================================
  // DEBUG GUI CONTROLS
  // ============================================================================

  /**
   * Add comprehensive lighting controls to GUI
   */
  addGui(gui: any): void {
    const lightingFolder = gui.addFolder('💡 Lighting System');

    // Ambient light controls
    const ambientFolder = lightingFolder.addFolder('🌌 Ambient Light (Background)');
    ambientFolder.add(this.ambientLight, 'intensity', 0, 5).name('Intensity').listen();

    // Directional light controls
    const directionalFolder = lightingFolder.addFolder('☀️ Directional Light (Main + Shadows)');
    directionalFolder.add(this.directionalLight, 'intensity', 0, 10).name('Intensity').listen();
    directionalFolder.addColor({ color: this.directionalLight.color.getHex() }, 'color')
      .onChange((value: number) => this.directionalLight.color.setHex(value));
    directionalFolder.add(this.directionalLight, 'castShadow').name('Cast Shadows');

    // Point light controls
    const pointFolder = lightingFolder.addFolder('🔆 Point Light (Sun + Flare)');
    pointFolder.add(this.pointLight, 'intensity', 0, 10).name('Intensity').listen();
    pointFolder.addColor({ color: this.pointLight.color.getHex() }, 'color')
      .onChange((value: number) => this.pointLight.color.setHex(value));

    // Sky atmosphere controls
    this.addSkyAtmosphereGui(gui);

    lightingFolder.open();
  }

  /**
   * Add sky atmosphere controls to GUI
   */
  private addSkyAtmosphereGui(gui: any): void {
    const skyFolder = gui.addFolder('🌅 Sky Atmosphere');

    // Sun position control
    GuiHelper.addPositionGui(skyFolder, 'sun', this.sky.material.uniforms['sunPosition']?.value);

    // Atmosphere parameters
    const skyUniforms = this.sky.material.uniforms;
    for (const key in this.skyOptions) {
      if (skyUniforms[key]) {
        let max = 1;
        if (key === 'turbidity') max = 10;
        if (key === 'rayleigh') max = 4;
        if (key === 'mieCoefficient') max = 0.1;

        skyFolder.add(skyUniforms[key], 'value', 0, max)
          .name(key.charAt(0).toUpperCase() + key.slice(1))
          .listen();
      }
    }
  }

  // ============================================================================
  // THEME SYSTEM INTEGRATION
  // ============================================================================

  /**
   * Apply theme-based lighting and sky settings
   * This method is called by the ThemeEngine when themes are switched
   */
  applyTheme(skyTheme: any): void {
    console.log('🌅 Applying sky theme:', skyTheme);

    // Update time of day and sun position
    if (skyTheme.timeOfDay !== undefined) {
      this.updateSunPosition(skyTheme.timeOfDay);
    }

    // Apply general sun intensity to all lights
    if (skyTheme.sunIntensity !== undefined) {
      this.pointLight.intensity = skyTheme.sunIntensity;
      this.ambientLight.intensity = skyTheme.sunIntensity;

      // Only update directional light from sunIntensity if no specific config
      if (!skyTheme.directionalLight?.intensity) {
        this.directionalLight.intensity = skyTheme.sunIntensity * LIGHTING_CONFIG.DIRECTIONAL_LIGHT_MULTIPLIER;
      }
    }

    // Apply specific directional light configuration
    this.applyDirectionalLightTheme(skyTheme.directionalLight);

    // Note: Fog is handled by ThemeEngine to avoid conflicts
  }

  /**
   * Apply directional light specific theme settings
   */
  private applyDirectionalLightTheme(dlConfig: any): void {
    if (!dlConfig || !this.directionalLight) return;

    console.log('🔦 Applying directional light theme settings:', dlConfig);

    // Light intensity
    if (dlConfig.intensity !== undefined) {
      this.directionalLight.intensity = dlConfig.intensity;
    }

    // Light color
    if (dlConfig.color) {
      this.directionalLight.color = new THREE.Color(dlConfig.color);
    }

    // Shadow settings
    if (dlConfig.castShadow !== undefined) {
      this.directionalLight.castShadow = dlConfig.castShadow;
    }

    // Shadow quality
    if (dlConfig.shadowMapSize !== undefined && this.directionalLight.shadow) {
      this.directionalLight.shadow.mapSize.width = dlConfig.shadowMapSize;
      this.directionalLight.shadow.mapSize.height = dlConfig.shadowMapSize;
    }

    // Shadow camera bounds
    if (dlConfig.shadowCamera && this.directionalLight.shadow?.camera) {
      const camera = this.directionalLight.shadow.camera as THREE.OrthographicCamera;
      const sc = dlConfig.shadowCamera;

      if (sc.near !== undefined) camera.near = sc.near;
      if (sc.far !== undefined) camera.far = sc.far;
      if (sc.left !== undefined) camera.left = sc.left;
      if (sc.right !== undefined) camera.right = sc.right;
      if (sc.top !== undefined) camera.top = sc.top;
      if (sc.bottom !== undefined) camera.bottom = sc.bottom;

      camera.updateProjectionMatrix();
    }
  }
}
