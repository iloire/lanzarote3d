import * as THREE from 'three';
import { Theme, ThemeApplicationOptions } from '../types/Theme';
import { StoryOptions } from '../../apps/shared/types';
import Environment from '../../apps/shared/env/environment';
import { Weather } from '../components/physics';

export class ThemeEngine {
  private static currentTheme: Theme | null = null;

  /**
   * Apply a theme to the entire scene and its components
   */
  static async apply(
    options: StoryOptions,
    theme: Theme,
    applicationOptions: ThemeApplicationOptions = {}
  ): Promise<void> {
    const { skipComponents = [] } = applicationOptions;

    console.log(`Applying theme: ${theme.name}`);

    // Store current theme reference
    this.currentTheme = theme;

    try {
      // Apply sky/lighting settings
      if (!skipComponents.includes('sky') && theme.sky) {
        await this.applySkyTheme(options, theme);
      }

      // Apply water styling
      if (!skipComponents.includes('water') && theme.water && options.water) {
        await this.applyWaterTheme(options.water, theme);
      }

      // Apply terrain styling to Island component
      if (!skipComponents.includes('terrain') && theme.terrain && options.terrainInstance) {
        await this.applyTerrainTheme(options.terrainInstance, theme);
      }

      // Apply environment styling (clouds, etc.)
      if (!skipComponents.includes('environment') && theme.clouds && options.environment) {
        await this.applyEnvironmentTheme(options.environment, theme);
      }

      // Apply ambient scene settings
      if (!skipComponents.includes('ambient') && theme.ambient) {
        await this.applyAmbientTheme(options, theme);
      }

      console.log(`Theme '${theme.name}' applied successfully`);
    } catch (error) {
      console.error(`Failed to apply theme '${theme.name}':`, error);
      throw error;
    }
  }

  /**
   * Apply theme to environment components (clouds, terrain, weather)
   */
  static async applyToEnvironment(
    env: Environment,
    theme: Theme,
    _options?: { terrain?: THREE.Mesh }
  ): Promise<void> {
    console.log(`Applying theme to environment: ${theme.name}`);

    try {
      // Update cloud colors for existing clouds
      env.updateCloudColors(theme);

      // Weather settings are applied when creating Weather instance
      // This is handled in the demo files

      // Note: Terrain is typically handled during creation
      // but we can add methods to update it post-creation if needed

      console.log(`Theme '${theme.name}' applied to environment successfully`);
    } catch (error) {
      console.error(`Failed to apply theme to environment '${theme.name}':`, error);
      throw error;
    }
  }

  /**
   * Apply sky and lighting theme
   */
  private static async applySkyTheme(options: StoryOptions, theme: Theme): Promise<void> {
    const { sky } = theme;

    if (options.sky && sky.timeOfDay !== undefined) {
      options.sky.updateSunPosition(sky.timeOfDay);
    }

    // Apply fog settings - check if fog is explicitly enabled/disabled
    if (sky.fogEnabled === false) {
      // Explicitly disable fog
      options.scene.fog = null;
    } else if (
      sky.fogEnabled === true ||
      (sky.fogEnabled === undefined && sky.fogColor && sky.fogDensity !== undefined)
    ) {
      // Apply fog if explicitly enabled OR if fog properties are defined (backward compatibility)
      const fogColor = new THREE.Color(sky.fogColor || '#000000');
      const fogDensity = sky.fogDensity !== undefined ? sky.fogDensity : 0.001;
      const fog = new THREE.Fog(fogColor, 1000, Math.min(20000, 20000 / (1 + fogDensity * 100)));
      options.scene.fog = fog;
    }
  }

  /**
   * Apply water theme
   */
  private static async applyWaterTheme(waterMesh: THREE.Mesh, theme: Theme): Promise<void> {
    const { water } = theme;

    if (waterMesh.material && 'color' in waterMesh.material) {
      const material = waterMesh.material as THREE.MeshLambertMaterial;
      material.color = new THREE.Color(water.color);
      material.opacity = water.opacity;
      material.transparent = water.opacity < 1.0;
      material.needsUpdate = true;
    }
  }

  /**
   * Apply terrain theme to Island component
   */
  private static async applyTerrainTheme(terrainInstance: any, theme: Theme): Promise<void> {
    if (terrainInstance && typeof terrainInstance.applyTheme === 'function') {
      console.log('🌍 Applying terrain theme to Island component');
      terrainInstance.applyTheme(theme.terrain);
    } else {
      console.warn('🌍 Terrain instance not available or does not support theming');
    }
  }

  /**
   * Apply environment theme (clouds, etc.)
   */
  private static async applyEnvironmentTheme(environment: any, theme: Theme): Promise<void> {
    if (environment && typeof environment.updateCloudColors === 'function') {
      console.log('🌥️ Applying environment theme to update cloud colors');
      environment.updateCloudColors(theme);
    } else {
      console.warn('🌥️ Environment instance not available or does not support cloud color theming');
    }
  }

  /**
   * Apply ambient scene theme
   */
  private static async applyAmbientTheme(options: StoryOptions, theme: Theme): Promise<void> {
    const { ambient } = theme;

    if (!ambient) return;

    // Apply background color
    if (ambient.backgroundColor) {
      options.scene.background = new THREE.Color(ambient.backgroundColor);
    }

    // Note: Lighting intensity modifications would need access to the lighting system
    // This could be extended based on how lighting is structured in the Sky component
  }

  /**
   * Create weather settings from theme
   */
  static createWeatherFromTheme(theme: Theme): Weather {
    return new Weather(theme.weather);
  }

  /**
   * Get cloud options from theme
   */
  static getCloudOptionsFromTheme(theme: Theme): { colors: string[] } {
    return {
      colors: theme.clouds.colors,
      // Additional cloud options can be added here as the Clouds component supports them
    };
  }

  /**
   * Get terrain style from theme
   */
  static getTerrainStyleFromTheme(theme: Theme): string {
    return theme.terrain.style;
  }

  /**
   * Get current applied theme
   */
  static getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  /**
   * Check if a theme is currently applied
   */
  static hasTheme(): boolean {
    return this.currentTheme !== null;
  }

  /**
   * Clear current theme
   */
  static clearTheme(): void {
    this.currentTheme = null;
  }

  /**
   * Create a custom theme by merging base theme with overrides
   */
  static createCustomTheme(baseTheme: Theme, overrides: Partial<Theme>): Theme {
    return {
      ...baseTheme,
      ...overrides,
      sky: { ...baseTheme.sky, ...overrides.sky },
      clouds: { ...baseTheme.clouds, ...overrides.clouds },
      terrain: { ...baseTheme.terrain, ...overrides.terrain },
      water: { ...baseTheme.water, ...overrides.water },
      weather: { ...baseTheme.weather, ...overrides.weather },
      ambient: { ...baseTheme.ambient, ...overrides.ambient },
    };
  }

  /**
   * Validate theme structure
   */
  static validateTheme(theme: any): theme is Theme {
    return (
      typeof theme === 'object' &&
      typeof theme.id === 'string' &&
      typeof theme.name === 'string' &&
      typeof theme.description === 'string' &&
      typeof theme.sky === 'object' &&
      typeof theme.clouds === 'object' &&
      typeof theme.terrain === 'object' &&
      typeof theme.water === 'object' &&
      typeof theme.weather === 'object'
    );
  }
}

export default ThemeEngine;
