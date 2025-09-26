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
export declare const Easing: {
    linear: (t: number) => number;
    easeInOut: (t: number) => number;
    easeIn: (t: number) => number;
    easeOut: (t: number) => number;
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
export declare class SimpleAnimator {
    private animations;
    private animationId;
    private isRunning;
    private lastTime;
    /**
     * Start the animator loop
     */
    start(): void;
    /**
     * Stop the animator loop
     */
    stop(): void;
    /**
     * Create and start an animation
     */
    animate(id: string, duration: number, animateFunction: AnimationFunction, onComplete?: AnimationCompleteCallback, easing?: (t: number) => number): void;
    /**
     * Stop a specific animation
     */
    stopAnimation(id: string): void;
    /**
     * Check if an animation is running
     */
    isAnimating(id: string): boolean;
    /**
     * Get debug info
     */
    getDebugInfo(): {
        isRunning: boolean;
        activeAnimations: string[];
        count: number;
    };
    /**
     * Main animation loop - simple and transparent
     */
    private loop;
}
export declare const animator: SimpleAnimator;
//# sourceMappingURL=SimpleAnimator.d.ts.map