import * as THREE from 'three';

/**
 * Base class for objects that float on water with realistic wave motion
 */
export class FloatingObject {
  protected mesh: THREE.Mesh | THREE.Group | null = null;
  protected originalPosition: THREE.Vector3 = new THREE.Vector3();
  protected animationId: number | null = null;
  protected isFloating = false;
  protected floatingOffset = Math.random() * Math.PI * 2; // Randomize wave phase

  /**
   * Start the floating animation for this object
   */
  public startFloating(): void {
    if (!this.mesh || this.isFloating) return;

    this.originalPosition.copy(this.mesh.position);
    this.isFloating = true;
    this.animate();
  }

  /**
   * Stop the floating animation
   */
  public stopFloating(): void {
    this.isFloating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Dispose of the floating object
   */
  public dispose(): void {
    this.stopFloating();
    this.mesh = null;
  }

  private animate = (): void => {
    if (!this.isFloating || !this.mesh) return;

    const time = Date.now() * 0.001;

    // Realistic ocean wave simulation with multiple wave frequencies
    const primaryWave = Math.sin(time * 0.8 + this.floatingOffset) * 12;
    const secondaryWave = Math.sin(time * 1.3 + this.floatingOffset * 1.2) * 6;
    const tertiaryWave = Math.cos(time * 0.5 + this.floatingOffset * 0.8) * 4;
    const swellWave = Math.sin(time * 0.3 + this.floatingOffset * 1.5) * 8;

    // Combine waves for realistic ocean motion
    const totalWaveHeight = primaryWave + secondaryWave + tertiaryWave + swellWave;
    this.mesh.position.y = this.originalPosition.y + totalWaveHeight;

    // Enhanced realistic boat movement - rolling and pitching like in ocean waves
    this.mesh.rotation.z = Math.sin(time * 0.9 + this.floatingOffset * 0.7) * 0.08; // Roll
    this.mesh.rotation.x = Math.cos(time * 0.7 + this.floatingOffset * 0.6) * 0.05; // Pitch

    // Slight yaw drift (preserve original Y rotation)
    const originalY = this.mesh.userData.originalRotationY || 0;
    this.mesh.rotation.y = originalY + Math.sin(time * 0.4 + this.floatingOffset * 0.4) * 0.02;

    this.animationId = requestAnimationFrame(this.animate);
  };

  /**
   * Set the mesh that should float
   */
  protected setMesh(mesh: THREE.Mesh | THREE.Group): void {
    this.mesh = mesh;
    // Store original rotation Y for yaw drift calculation
    this.mesh.userData.originalRotationY = this.mesh.rotation.y;
  }
}