import * as THREE from 'three';

export interface FloatingBehaviorOptions {
  scaleMultiplier?: number;
  autoStart?: boolean;
  wavePhaseOffset?: number;
}

/**
 * Reusable floating behavior system for objects that should float on water
 * with realistic wave motion simulation
 */
export class FloatingBehavior {
  private mesh: THREE.Object3D | null = null;
  private originalPosition: THREE.Vector3 = new THREE.Vector3();
  private animationId: number | null = null;
  private isFloating = false;
  private floatingOffset: number;
  private scaleMultiplier: number;

  constructor(options: FloatingBehaviorOptions = {}) {
    this.scaleMultiplier = options.scaleMultiplier || 1;
    this.floatingOffset = options.wavePhaseOffset || Math.random() * Math.PI * 2;
  }

  /**
   * Attach floating behavior to a Three.js object
   */
  public attachTo(object: THREE.Object3D): void {
    this.mesh = object;
    // Store original rotation Y for yaw drift calculation
    this.mesh.userData.originalRotationY = this.mesh.rotation.y;
  }

  /**
   * Start the floating animation
   */
  public start(): void {
    if (!this.mesh || this.isFloating) return;

    this.originalPosition.copy(this.mesh.position);
    this.isFloating = true;
    this.animate();
  }

  /**
   * Stop the floating animation
   */
  public stop(): void {
    this.isFloating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Update the scale multiplier for floating amplitudes
   */
  public setScale(scale: number): void {
    this.scaleMultiplier = scale;
  }

  /**
   * Get current floating state
   */
  public isActive(): boolean {
    return this.isFloating;
  }

  /**
   * Dispose of the floating behavior
   */
  public dispose(): void {
    this.stop();
    this.mesh = null;
  }

  private animate = (): void => {
    if (!this.isFloating || !this.mesh) return;

    const time = Date.now() * 0.001;

    // Realistic ocean wave simulation with scale-adjusted amplitude (increased for visibility)
    const primaryWave = Math.sin(time * 0.8 + this.floatingOffset) * 12 * this.scaleMultiplier;
    const secondaryWave = Math.sin(time * 1.3 + this.floatingOffset * 1.2) * 6 * this.scaleMultiplier;
    const tertiaryWave = Math.cos(time * 0.5 + this.floatingOffset * 0.8) * 4.5 * this.scaleMultiplier;
    const swellWave = Math.sin(time * 0.3 + this.floatingOffset * 1.5) * 9 * this.scaleMultiplier;

    // Combine waves for realistic ocean motion
    const totalWaveHeight = primaryWave + secondaryWave + tertiaryWave + swellWave;
    this.mesh.position.y = this.originalPosition.y + totalWaveHeight;

    // Realistic boat movement with scale-adjusted motion
    this.mesh.rotation.z = Math.sin(time * 0.9 + this.floatingOffset * 0.7) * 0.05 * this.scaleMultiplier;
    this.mesh.rotation.x = Math.cos(time * 0.7 + this.floatingOffset * 0.6) * 0.03 * this.scaleMultiplier;

    // Subtle yaw drift (preserve original Y rotation)
    const originalY = this.mesh.userData.originalRotationY || 0;
    this.mesh.rotation.y = originalY + Math.sin(time * 0.4 + this.floatingOffset * 0.4) * 0.02 * this.scaleMultiplier;

    this.animationId = requestAnimationFrame(this.animate);
  };
}