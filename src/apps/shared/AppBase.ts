import * as THREE from "three";
import { SceneManager, PerformanceMonitor } from '../../foundation';
import { StoryOptions } from "./types";

export interface AppConfig {
  name: string;
  description: string;
  requiredComponents: string[];
  scene?: {
    environment?: 'lanzarote' | 'custom';
    lighting?: 'dynamic' | 'static';
    physics?: boolean;
    fog?: {
      enabled: boolean;
      color?: number;
      near?: number;
      far?: number;
    };
  };
  performance?: {
    monitoring?: boolean;
    logIntervalMs?: number;
  };
}

/**
 * AppBase - Common foundation for all Lanzarote3D apps
 *
 * Provides:
 * - Standardized app initialization
 * - Performance monitoring
 * - Scene management
 * - Error handling
 * - Cleanup utilities
 */
export abstract class AppBase {
  protected config: AppConfig;
  protected sceneManager?: SceneManager;
  protected performanceMonitor?: PerformanceMonitor;
  protected isLoaded: boolean = false;

  constructor(config: AppConfig) {
    this.config = config;
    console.log(`🚀 Initializing ${config.name}`);
    console.log(`📦 Required components: ${config.requiredComponents.join(', ')}`);
  }

  protected initializeCore(options: StoryOptions): void {
    const { renderer } = options;

    // Setup scene management if requested
    if (this.config.scene) {
      this.sceneManager = new SceneManager(this.config.scene);
    }

    // Setup performance monitoring if requested
    if (this.config.performance?.monitoring) {
      this.performanceMonitor = new PerformanceMonitor(renderer, {
        minFps: 30,
        maxFrameTime: 33.33,
        maxMemoryUsage: 150 * 1024 * 1024 // 150MB
      });

      // Log performance periodically
      if (this.config.performance.logIntervalMs) {
        setInterval(() => {
          if (this.performanceMonitor) {
            this.performanceMonitor.logPerformance();
          }
        }, this.config.performance.logIntervalMs);
      }
    }
  }

  protected updatePerformance(): void {
    if (this.performanceMonitor) {
      this.performanceMonitor.update();
    }
  }

  // Abstract methods that each app must implement
  abstract load(options: StoryOptions): Promise<void> | void;

  // Optional lifecycle methods
  protected onAppStart?(): void;
  protected onAppStop?(): void;
  protected onAppPause?(): void;
  protected onAppResume?(): void;

  // Utility methods
  protected logAppInfo(): void {
    console.group(`📱 ${this.config.name} - App Info`);
    console.log(`Description: ${this.config.description}`);
    console.log(`Components: ${this.config.requiredComponents.join(', ')}`);
    console.log(`Performance Monitoring: ${this.config.performance?.monitoring ? 'Enabled' : 'Disabled'}`);
    console.log(`Scene Management: ${this.sceneManager ? 'Enabled' : 'Disabled'}`);
    console.groupEnd();
  }

  protected handleError(error: Error, context: string): void {
    console.error(`❌ ${this.config.name} Error in ${context}:`, error);

    // Could send to analytics system here
    if (this.performanceMonitor) {
      console.log('Performance at error:', this.performanceMonitor.getMetrics());
    }
  }

  public getAppInfo() {
    return {
      name: this.config.name,
      description: this.config.description,
      components: this.config.requiredComponents,
      isLoaded: this.isLoaded,
      performance: this.performanceMonitor?.getMetrics()
    };
  }

  public dispose(): void {
    console.log(`🧹 Cleaning up ${this.config.name}`);

    this.onAppStop?.();

    if (this.sceneManager) {
      this.sceneManager.dispose();
    }

    this.isLoaded = false;
  }
}

export default AppBase;