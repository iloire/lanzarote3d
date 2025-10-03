import { Theme, TerrainTheme, SatelliteImageryConfig } from '../types/Theme';
import SatelliteTextureManager from './satellite-textures';

/**
 * Predefined satellite terrain themes for easy usage
 */
export class SatelliteThemes {
  /**
   * Get base theme structure for satellite themes
   */
  private static getBaseSatelliteTheme(): Theme {
    return {
      id: 'satellite-base',
      name: 'Satellite Base',
      enabled: true,
      sky: {
        timeOfDay: 13,
        sunIntensity: 2.0,
        directionalLight: {
          intensity: 1.5,
          color: '#ffffff',
          castShadow: true,
          shadowMapSize: 2048,
        },
      },
      clouds: {
        colors: ['#FFFFFF', '#E6F3FF', '#87CEEB'],
        density: 0.4, // Reduced for better satellite visibility
        opacity: 0.8,
      },
      water: {
        color: '#2196f3',
        opacity: 0.85,
        roughness: 0.3,
      },
      weather: {
        windDirectionDegreesFromNorth: 270,
        speedMetresPerSecond: 5,
        lclLevel: 1800,
      },
      ambient: {
        lightingIntensity: 1.2,
        shadowIntensity: 0.8,
      },
      terrain: {
        style: 'satellite',
      },
    };
  }

  /**
   * Create a basic satellite terrain theme for Lanzarote
   */
  static createLanzaroteSatelliteTheme(): Theme {
    const baseTheme = this.getBaseSatelliteTheme();
    return {
      ...baseTheme,
      terrain: {
        style: 'satellite',
        satelliteImagery: {
          enabled: true,
          mode: 'static',
          staticConfig: SatelliteTextureManager.createLanzaroteConfig(),
          blendMode: 'normal',
          opacity: 1.0,
          fallbackToWireframe: true,
          uvMapping: {
            offsetU: 0,
            offsetV: 0,
            scaleU: 1,
            scaleV: 1,
          },
        },
      },
    };
  }

  /**
   * Create a high-contrast satellite theme with enhanced features
   */
  static createEnhancedSatelliteTheme(): Theme {
    const baseTheme = this.getBaseSatelliteTheme();
    return {
      ...baseTheme,
      id: 'enhanced-satellite',
      name: 'Enhanced Satellite',
      ambient: {
        ...baseTheme.ambient!,
        lightingIntensity: 1.4, // Brighter lighting for enhanced contrast
      },
      terrain: {
        style: 'satellite',
        satelliteImagery: {
          enabled: true,
          mode: 'static',
          staticConfig: SatelliteTextureManager.createLanzaroteConfig(),
          blendMode: 'multiply',
          opacity: 0.9,
          fallbackToWireframe: true,
          uvMapping: {
            offsetU: 0,
            offsetV: 0,
            scaleU: 1.1, // Slightly larger for better coverage
            scaleV: 1.1,
          },
        },
        customMaterial: {
          roughness: 0.7,
          metalness: 0.0,
          emissiveIntensity: 0.1,
        },
      },
    };
  }

  /**
   * Create a hybrid theme that combines satellite imagery with custom material properties
   */
  static createHybridSatelliteTheme(): Theme {
    const baseTheme = this.getBaseSatelliteTheme();
    return {
      ...baseTheme,
      id: 'hybrid-satellite',
      name: 'Hybrid Satellite',
      sky: {
        ...baseTheme.sky,
        timeOfDay: 15.5, // Late afternoon light
        sunIntensity: 1.8,
      },
      terrain: {
        style: 'satellite',
        satelliteImagery: {
          enabled: true,
          mode: 'static',
          staticConfig: SatelliteTextureManager.createLanzaroteConfig(),
          blendMode: 'overlay',
          opacity: 0.8,
          fallbackToWireframe: true,
          uvMapping: {
            offsetU: 0,
            offsetV: 0,
            scaleU: 1,
            scaleV: 1,
          },
        },
        customMaterial: {
          color: '#f4f1eb', // Slight warm tint
          roughness: 0.8,
          metalness: 0.1,
          emissive: '#2a1810',
          emissiveIntensity: 0.05,
        },
      },
    };
  }

  /**
   * Create a development/testing theme with placeholder texture
   */
  static createTestSatelliteTheme(): Theme {
    const baseTheme = this.getBaseSatelliteTheme();
    return {
      ...baseTheme,
      id: 'test-satellite',
      name: 'Test Satellite',
      terrain: {
        style: 'satellite',
        satelliteImagery: {
          enabled: true,
          mode: 'static',
          staticConfig: {
            textureAtlas: '/assets/textures/test-pattern.jpg',
            tileMap: '/assets/textures/lanzarote-tile-mapping.json',
            attribution: 'Test/Development Texture',
            source: 'custom',
            resolution: 10,
            bounds: {
              north: 29.0,
              south: 28.6,
              east: -13.3,
              west: -13.7,
            },
          },
          blendMode: 'normal',
          opacity: 1.0,
          fallbackToWireframe: true,
        },
      },
    };
  }

  /**
   * Get all available satellite themes
   */
  static getAllThemes(): { name: string; theme: Theme; description: string }[] {
    return [
      {
        name: 'Basic Satellite',
        theme: this.createLanzaroteSatelliteTheme(),
        description: 'Standard satellite imagery with realistic terrain textures',
      },
      {
        name: 'Enhanced Satellite',
        theme: this.createEnhancedSatelliteTheme(),
        description: 'High-contrast satellite imagery with enhanced visual features',
      },
      {
        name: 'Hybrid Satellite',
        theme: this.createHybridSatelliteTheme(),
        description: 'Blended satellite imagery with custom material properties',
      },
      {
        name: 'Test Satellite',
        theme: this.createTestSatelliteTheme(),
        description: 'Development theme with placeholder textures',
      },
    ];
  }

  /**
   * Create a custom satellite theme with user-defined parameters
   */
  static createCustomSatelliteTheme(config: {
    textureAtlas?: string;
    blendMode?: 'multiply' | 'overlay' | 'screen' | 'normal';
    opacity?: number;
    scaleU?: number;
    scaleV?: number;
    offsetU?: number;
    offsetV?: number;
    roughness?: number;
    metalness?: number;
    color?: string;
    emissive?: string;
    id?: string;
    name?: string;
  }): Theme {
    const baseTheme = this.getBaseSatelliteTheme();
    const defaultConfig = SatelliteTextureManager.createLanzaroteConfig();

    if (config.textureAtlas) {
      defaultConfig.textureAtlas = config.textureAtlas;
    }

    return {
      ...baseTheme,
      id: config.id || 'custom-satellite',
      name: config.name || 'Custom Satellite',
      terrain: {
        style: 'satellite',
        satelliteImagery: {
          enabled: true,
          mode: 'static',
          staticConfig: defaultConfig,
          blendMode: config.blendMode || 'normal',
          opacity: config.opacity ?? 1.0,
          fallbackToWireframe: true,
          uvMapping: {
            offsetU: config.offsetU || 0,
            offsetV: config.offsetV || 0,
            scaleU: config.scaleU || 1,
            scaleV: config.scaleV || 1,
          },
        },
        customMaterial: {
          roughness: config.roughness ?? 0.8,
          metalness: config.metalness ?? 0.1,
          color: config.color,
          emissive: config.emissive,
        },
      },
    };
  }
}

export default SatelliteThemes;
