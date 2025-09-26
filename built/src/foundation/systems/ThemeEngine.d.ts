import * as THREE from 'three';
import { Theme, ThemeApplicationOptions } from '../types/Theme';
import { StoryOptions } from '../../apps/shared/types';
import Environment from '../../apps/shared/env/environment';
import { Weather } from '../components/physics';
export declare class ThemeEngine {
    private static currentTheme;
    /**
     * Apply a theme to the entire scene and its components
     */
    static apply(options: StoryOptions, theme: Theme, applicationOptions?: ThemeApplicationOptions): Promise<void>;
    /**
     * Apply theme to environment components (clouds, terrain, weather)
     */
    static applyToEnvironment(_env: Environment, theme: Theme, _options?: {
        terrain?: THREE.Mesh;
    }): Promise<void>;
    /**
     * Apply sky and lighting theme
     */
    private static applySkyTheme;
    /**
     * Apply water theme
     */
    private static applyWaterTheme;
    /**
     * Apply ambient scene theme
     */
    private static applyAmbientTheme;
    /**
     * Create weather settings from theme
     */
    static createWeatherFromTheme(theme: Theme): Weather;
    /**
     * Get cloud options from theme
     */
    static getCloudOptionsFromTheme(theme: Theme): {
        colors: string[];
    };
    /**
     * Get terrain style from theme
     */
    static getTerrainStyleFromTheme(theme: Theme): string;
    /**
     * Get current applied theme
     */
    static getCurrentTheme(): Theme | null;
    /**
     * Check if a theme is currently applied
     */
    static hasTheme(): boolean;
    /**
     * Clear current theme
     */
    static clearTheme(): void;
    /**
     * Create a custom theme by merging base theme with overrides
     */
    static createCustomTheme(baseTheme: Theme, overrides: Partial<Theme>): Theme;
    /**
     * Validate theme structure
     */
    static validateTheme(theme: any): theme is Theme;
}
export default ThemeEngine;
//# sourceMappingURL=ThemeEngine.d.ts.map