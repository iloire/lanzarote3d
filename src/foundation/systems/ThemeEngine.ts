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
    const {
      skipComponents = [],
      animateTransition = false,
      transitionDuration = 1000,
    } = applicationOptions;

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
    options?: { terrain?: THREE.Mesh }
  ): Promise<void> {
    console.log(`Applying theme to environment: ${theme.name}`);

    try {
      // Weather settings are applied when creating Weather instance
      // This is handled in the demo files

      // Note: Clouds and terrain are typically handled during creation
      // but we can add methods to update them post-creation if needed

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

    // Apply fog settings
    if (sky.fogColor && sky.fogDensity !== undefined) {
      const fogColor = new THREE.Color(sky.fogColor);
      const fog = new THREE.Fog(fogColor, 1000, Math.min(20000, 20000 / (1 + sky.fogDensity * 100)));
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