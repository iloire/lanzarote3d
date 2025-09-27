import { StoryOptions } from './types';

export interface NonRenderingAppConfig {
  name: string;
  description: string;
  requiresThreeJS?: boolean; // Set to false for pure HTML/DOM apps
}

/**
 * NonRenderingAppBase - Base class for applications that don't render 3D content
 *
 * Use this for:
 * - Debug dashboards
 * - Tile mappers
 * - Configuration tools
 * - Data visualization tools that use DOM/Canvas2D
 * - Any app that primarily uses HTML/CSS UI
 *
 * This base class:
 * - Skips Three.js scene setup
 * - Provides DOM container management
 * - Handles cleanup of HTML elements
 * - Minimizes performance overhead
 */
export abstract class NonRenderingAppBase {
  protected config: NonRenderingAppConfig;
  protected container: HTMLElement | undefined;
  protected isLoaded: boolean = false;
  protected cleanupCallbacks: Array<() => void> = [];

  constructor(config: NonRenderingAppConfig) {
    this.config = config;
    console.log(`🚀 Initializing non-rendering app: ${config.name}`);
  }

  /**
   * Creates and manages a DOM container for the app UI
   * Positioned to work with existing menu layout (leaves space for menu)
   */
  protected createUIContainer(): HTMLElement {
    // Remove any existing container
    this.destroyUIContainer();

    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: calc(100% - 240px);
      height: calc(100% - 40px);
      background: linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%);
      color: white;
      font-family: 'Consolas', 'Monaco', monospace;
      overflow: auto;
      z-index: 1000;
      border-radius: 8px;
      border: 1px solid #444;
    `;
    document.body.appendChild(container);
    this.container = container;
    return container;
  }

  /**
   * Destroys the UI container and cleans up DOM
   */
  protected destroyUIContainer(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = undefined;
    }
  }

  /**
   * Register a cleanup callback to be called on dispose
   */
  protected addCleanup(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Handle errors with context
   */
  protected handleError(error: Error, context: string): void {
    console.error(`❌ ${this.config.name} Error in ${context}:`, error);

    // Display error in UI if container exists
    if (this.container) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        background: #ff000020;
        border: 1px solid #ff0000;
        padding: 10px;
        margin: 10px;
        border-radius: 5px;
      `;
      errorDiv.innerHTML = `
        <strong>Error in ${context}:</strong><br>
        <pre>${error.message}</pre>
      `;
      this.container.appendChild(errorDiv);
    }
  }

  /**
   * Main load method - called when app is activated
   * For non-rendering apps, StoryOptions may have minimal content
   */
  abstract load(options: StoryOptions): Promise<void> | void;

  /**
   * Get app information
   */
  public getAppInfo() {
    return {
      name: this.config.name,
      description: this.config.description,
      requiresThreeJS: this.config.requiresThreeJS ?? false,
      isLoaded: this.isLoaded,
    };
  }

  /**
   * Clean up the app
   */
  public dispose(): void {
    console.log(`🧹 Disposing ${this.config.name}`);

    // Call all registered cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    this.cleanupCallbacks = [];

    // Destroy UI container
    this.destroyUIContainer();

    this.isLoaded = false;
  }
}

export default NonRenderingAppBase;