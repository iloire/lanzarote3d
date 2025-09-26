/**
 * Simple, self-contained animation system
 *
 * No external dependencies, no hidden state, easy to debug.
 * Each animation is independent and can be started/stopped individually.
 */

export type AnimationFunction = (progress: number, deltaTime: number) => void;
export type AnimationCompleteCallback = () => void;

export interface Animation {
  id: string;
  duration: number;
  startTime: number;
  isRunning: boolean;
  animate: AnimationFunction;
  onComplete?: AnimationCompleteCallback;
  easing?: (t: number) => number;
}

/**
 * Simple easing functions
 */
export const Easing = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
};

/**
 * Simple, self-contained animator
 *
 * Usage:
 * ```
 * const animator = new SimpleAnimator();
 * animator.start();
 *
 * animator.animate('camera-move', 2000, (progress) => {
 *   camera.position.lerp(targetPosition, progress);
 * });
 * ```
 */
export class SimpleAnimator {
  private animations: Map<string, Animation> = new Map();
  private animationId: number | null = null;
  private isRunning: boolean = false;
  private lastTime: number = 0;

  /**
   * Start the animator loop
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
    console.log('SimpleAnimator started');
  }

  /**
   * Stop the animator loop
   */
  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isRunning = false;
    console.log('SimpleAnimator stopped');
  }

  /**
   * Create and start an animation
   */
  animate(
    id: string,
    duration: number,
    animateFunction: AnimationFunction,
    onComplete?: AnimationCompleteCallback,
    easing: (t: number) => number = Easing.easeInOut
  ): void {
    const animation: Animation = {
      id,
      duration,
      startTime: performance.now(),
      isRunning: true,
      animate: animateFunction,
      onComplete,
      easing
    };

    this.animations.set(id, animation);
    console.log(`Animation '${id}' started (${duration}ms)`);

    // Start the loop if not running
    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Stop a specific animation
   */
  stopAnimation(id: string): void {
    const animation = this.animations.get(id);
    if (animation) {
      animation.isRunning = false;
      this.animations.delete(id);
      console.log(`Animation '${id}' stopped`);
    }
  }

  /**
   * Check if an animation is running
   */
  isAnimating(id: string): boolean {
    const animation = this.animations.get(id);
    return animation ? animation.isRunning : false;
  }

  /**
   * Get debug info
   */
  getDebugInfo(): { isRunning: boolean; activeAnimations: string[]; count: number } {
    return {
      isRunning: this.isRunning,
      activeAnimations: Array.from(this.animations.keys()),
      count: this.animations.size
    };
  }

  /**
   * Main animation loop - simple and transparent
   */
  private loop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    // Update all active animations
    const completedAnimations: string[] = [];

    for (const [id, animation] of this.animations) {
      if (!animation.isRunning) continue;

      const elapsed = currentTime - animation.startTime;
      const rawProgress = Math.min(elapsed / animation.duration, 1);
      const easedProgress = animation.easing ? animation.easing(rawProgress) : rawProgress;

      try {
        // Call the animation function
        animation.animate(easedProgress, deltaTime);

        // Check if completed
        if (rawProgress >= 1) {
          completedAnimations.push(id);
          if (animation.onComplete) {
            animation.onComplete();
          }
          console.log(`Animation '${id}' completed`);
        }
      } catch (error) {
        console.error(`Error in animation '${id}':`, error);
        completedAnimations.push(id); // Remove broken animations
      }
    }

    // Clean up completed animations
    completedAnimations.forEach(id => this.animations.delete(id));

    // Stop loop if no animations remain
    if (this.animations.size === 0) {
      this.stop();
    } else {
      this.animationId = requestAnimationFrame(this.loop);
    }

    this.lastTime = currentTime;
  };
}

// Export a singleton instance
export const animator = new SimpleAnimator();