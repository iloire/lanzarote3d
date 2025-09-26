import * as TWEEN from "@tweenjs/tween.js";

/**
 * Animation callback function type
 * @param deltaTime - Time elapsed since last frame in milliseconds
 * @param totalTime - Total time elapsed since animation start in milliseconds
 */
export type AnimationCallback = (deltaTime: number, totalTime: number) => void;

/**
 * Animation registration interface
 */
export interface AnimationRegistration {
  id: string;
  callback: AnimationCallback;
  priority: number; // Lower numbers execute first
  enabled: boolean;
}

/**
 * Centralized Animation Manager
 *
 * Manages a single animation loop for the entire application to prevent
 * multiple competing requestAnimationFrame loops that cause performance
 * issues and timing conflicts.
 *
 * Features:
 * - Single requestAnimationFrame loop
 * - Priority-based callback execution
 * - Enable/disable individual animations
 * - Automatic TWEEN.js integration
 * - Performance timing tracking
 */
class AnimationManager {
  private static instance: AnimationManager;

  private registrations: Map<string, AnimationRegistration> = new Map();
  private isRunning: boolean = false;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private startTime: number = 0;

  // Performance tracking
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  /**
   * Register an animation callback
   * @param id - Unique identifier for the animation
   * @param callback - Function to call each frame
   * @param priority - Execution priority (lower = earlier, default: 100)
   */
  public register(
    id: string,
    callback: AnimationCallback,
    priority: number = 100
  ): void {
    if (this.registrations.has(id)) {
      console.warn(`Animation with id "${id}" already registered. Overwriting.`);
    }

    this.registrations.set(id, {
      id,
      callback,
      priority,
      enabled: true
    });

    // Start the loop if this is the first registration
    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Unregister an animation callback
   * @param id - Animation identifier to remove
   */
  public unregister(id: string): void {
    const removed = this.registrations.delete(id);

    if (removed) {
      console.log(`Animation "${id}" unregistered`);
    } else {
      console.warn(`Animation "${id}" was not registered`);
    }

    // Stop the loop if no registrations remain
    if (this.registrations.size === 0 && this.isRunning) {
      this.stop();
    }
  }

  /**
   * Enable/disable a specific animation
   * @param id - Animation identifier
   * @param enabled - Whether to enable the animation
   */
  public setEnabled(id: string, enabled: boolean): void {
    const registration = this.registrations.get(id);
    if (registration) {
      registration.enabled = enabled;
    } else {
      console.warn(`Animation "${id}" not found`);
    }
  }

  /**
   * Check if an animation is registered
   * @param id - Animation identifier
   */
  public isRegistered(id: string): boolean {
    return this.registrations.has(id);
  }

  /**
   * Get current FPS (updated every second)
   */
  public getFps(): number {
    return this.currentFps;
  }

  /**
   * Get list of registered animation IDs
   */
  public getRegisteredAnimations(): string[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * Start the animation loop
   */
  private start(): void {
    if (this.isRunning) {
      console.warn('AnimationManager is already running');
      return;
    }

    this.isRunning = true;
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.frameCount = 0;
    this.lastFpsUpdate = this.startTime;

    console.log('AnimationManager started');
    this.animate();
  }

  /**
   * Stop the animation loop
   */
  private stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.isRunning = false;
    console.log('AnimationManager stopped');
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    const totalTime = currentTime - this.startTime;

    // Update TWEEN.js (centralized)
    TWEEN.update(currentTime);

    // Execute registered callbacks in priority order
    const sortedRegistrations = Array.from(this.registrations.values())
      .filter(reg => reg.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const registration of sortedRegistrations) {
      try {
        registration.callback(deltaTime, totalTime);
      } catch (error) {
        console.error(`Error in animation callback "${registration.id}":`, error);
      }
    }

    // Update FPS counter every second
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.currentFps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }

    this.lastTime = currentTime;
  };

  /**
   * Force stop all animations (for cleanup)
   */
  public forceStop(): void {
    this.registrations.clear();
    this.stop();
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): {
    isRunning: boolean;
    registrationCount: number;
    fps: number;
    registrations: { id: string; priority: number; enabled: boolean }[];
  } {
    return {
      isRunning: this.isRunning,
      registrationCount: this.registrations.size,
      fps: this.currentFps,
      registrations: Array.from(this.registrations.values()).map(reg => ({
        id: reg.id,
        priority: reg.priority,
        enabled: reg.enabled
      }))
    };
  }
}

// Export singleton instance
export default AnimationManager.getInstance();