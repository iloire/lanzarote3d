import { Theme } from '../types/Theme';
import { getAllThemes, getThemeById, getDefaultTheme } from '../themes';
import { ThemeEngine } from './ThemeEngine';
import { StoryOptions } from '../../apps/shared/types';

/**
 * Global Theme Manager for dynamic theme switching across the application
 * Provides a singleton interface for theme management that can be accessed
 * from both the Menu and the currently loaded story/app
 */
class ThemeManager {
  private static instance: ThemeManager | null = null;
  private currentTheme: Theme | null = null;
  private storyOptions: StoryOptions | null = null;
  private isEnabled: boolean = false;
  private listeners: Array<(theme: Theme) => void> = [];
  private readonly STORAGE_KEY = 'lanzarote3d_selected_theme';

  /**
   * Get singleton instance of ThemeManager
   */
  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Initialize the theme manager with story options
   */
  initialize(storyOptions: StoryOptions): void {
    this.storyOptions = storyOptions;
    this.isEnabled = true;

    // Load theme from localStorage or use default
    const savedThemeId = this.loadThemeFromStorage();
    if (savedThemeId) {
      const savedTheme = getThemeById(savedThemeId);
      if (savedTheme) {
        this.currentTheme = savedTheme;
        console.log(`ThemeManager initialized with saved theme: ${savedTheme.name}`);
      } else {
        this.currentTheme = getDefaultTheme();
        console.log(
          `ThemeManager initialized with default theme (saved theme not found): ${this.currentTheme.name}`
        );
      }
    } else if (!this.currentTheme) {
      this.currentTheme = getDefaultTheme();
      console.log(`ThemeManager initialized with default theme: ${this.currentTheme.name}`);
    } else {
      console.log('ThemeManager initialized');
    }
  }

  /**
   * Disable the theme manager (called when story unloads)
   */
  disable(): void {
    this.isEnabled = false;
    this.storyOptions = null;
    this.currentTheme = null;
    console.log('ThemeManager disabled');
  }

  /**
   * Check if theme manager is ready to use
   */
  isReady(): boolean {
    return this.isEnabled && this.storyOptions !== null;
  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): Theme[] {
    return getAllThemes();
  }

  /**
   * Get current active theme
   */
  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  /**
   * Apply a theme to the current story
   */
  async applyTheme(themeId: string): Promise<boolean> {
    if (!this.isReady()) {
      console.warn('ThemeManager not ready - story may not be loaded yet');
      return false;
    }

    const theme = getThemeById(themeId);
    if (!theme) {
      console.error(`Theme with ID "${themeId}" not found`);
      return false;
    }

    try {
      console.log(`Applying theme: ${theme.name}`);

      // Apply theme to the current story options
      await ThemeEngine.apply(this.storyOptions!, theme);

      // Update current theme
      this.currentTheme = theme;

      // Save theme to localStorage
      this.saveThemeToStorage(theme.id);

      // Notify listeners
      this.notifyListeners(theme);

      console.log(`Theme "${theme.name}" applied successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to apply theme "${theme.name}":`, error);
      return false;
    }
  }

  /**
   * Set the initial theme (used when story loads with a default theme)
   */
  setCurrentTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.notifyListeners(theme);
  }

  /**
   * Add a listener for theme changes
   */
  addListener(callback: (theme: Theme) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove a listener for theme changes
   */
  removeListener(callback: (theme: Theme) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Notify all listeners of theme change
   */
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('Error in theme change listener:', error);
      }
    });
  }

  /**
   * Quick apply theme by index (for keyboard shortcuts)
   */
  async applyThemeByIndex(index: number): Promise<boolean> {
    const themes = this.getAvailableThemes();
    if (index >= 0 && index < themes.length) {
      return this.applyTheme(themes[index].id);
    }
    return false;
  }

  /**
   * Save theme ID to localStorage
   */
  private saveThemeToStorage(themeId: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, themeId);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }

  /**
   * Load theme ID from localStorage
   */
  private loadThemeFromStorage(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear saved theme from localStorage
   */
  clearSavedTheme(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Saved theme cleared from localStorage');
    } catch (error) {
      console.warn('Failed to clear theme from localStorage:', error);
    }
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();
export default themeManager;
