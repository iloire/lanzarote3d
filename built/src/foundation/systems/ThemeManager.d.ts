import { Theme } from '../types/Theme';
import { StoryOptions } from '../../apps/shared/types';
/**
 * Global Theme Manager for dynamic theme switching across the application
 * Provides a singleton interface for theme management that can be accessed
 * from both the Menu and the currently loaded story/app
 */
declare class ThemeManager {
    private static instance;
    private currentTheme;
    private storyOptions;
    private isEnabled;
    private listeners;
    private readonly STORAGE_KEY;
    /**
     * Get singleton instance of ThemeManager
     */
    static getInstance(): ThemeManager;
    /**
     * Initialize the theme manager with story options
     */
    initialize(storyOptions: StoryOptions): void;
    /**
     * Disable the theme manager (called when story unloads)
     */
    disable(): void;
    /**
     * Check if theme manager is ready to use
     */
    isReady(): boolean;
    /**
     * Get all available themes
     */
    getAvailableThemes(): Theme[];
    /**
     * Get current active theme
     */
    getCurrentTheme(): Theme | null;
    /**
     * Apply a theme to the current story
     */
    applyTheme(themeId: string): Promise<boolean>;
    /**
     * Set the initial theme (used when story loads with a default theme)
     */
    setCurrentTheme(theme: Theme): void;
    /**
     * Add a listener for theme changes
     */
    addListener(callback: (theme: Theme) => void): void;
    /**
     * Remove a listener for theme changes
     */
    removeListener(callback: (theme: Theme) => void): void;
    /**
     * Notify all listeners of theme change
     */
    private notifyListeners;
    /**
     * Quick apply theme by index (for keyboard shortcuts)
     */
    applyThemeByIndex(index: number): Promise<boolean>;
    /**
     * Save theme ID to localStorage
     */
    private saveThemeToStorage;
    /**
     * Load theme ID from localStorage
     */
    private loadThemeFromStorage;
    /**
     * Clear saved theme from localStorage
     */
    clearSavedTheme(): void;
}
export declare const themeManager: ThemeManager;
export default themeManager;
//# sourceMappingURL=ThemeManager.d.ts.map