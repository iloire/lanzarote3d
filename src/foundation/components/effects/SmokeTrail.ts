import * as THREE from 'three';
import { resourceManager } from '../../systems/ResourceManager';

export interface SmokeTrailOptions {
  emissionRate?: number;      // particles per second
  particleLifetime?: number;   // seconds
  initialSize?: number;        // starting scale
  finalSize?: number;          // ending scale
  color?: THREE.Color;         // smoke color
  maxParticles?: number;       // pool size
  turbulence?: number;         // random drift amount
  enabled?: boolean;           // toggle emission
}

interface SmokeParticle {
  position: THREE.Vector3;
  size: number;
  velocity: THREE.Vector3;
  age: number;
  lifetime: number;
  initialSize: number;
  finalSize: number;
  active: boolean;
}

/**
 * SmokeTrail - Particle system for aircraft smoke trails
 *
 * Creates a realistic smoke trail effect behind aircraft engines.
 * All particles are instances of one InstancedMesh, so a trail is a single draw call.
 * Particles grow and drift over their lifetime.
 */
export class SmokeTrail {
  private group: THREE.Group;
  private particles: SmokeParticle[] = [];
  private options: Required<SmokeTrailOptions>;
  private timeSinceLastEmission: number = 0;
  private material: THREE.MeshStandardMaterial;
  private mesh: THREE.InstancedMesh;
  private readonly matrix = new THREE.Matrix4();
  private readonly scale = new THREE.Vector3();
  private readonly rotation = new THREE.Quaternion();

  constructor(options: SmokeTrailOptions = {}) {
    this.group = new THREE.Group();
    this.group.name = 'SmokeTrail';

    // Set default options
    this.options = {
      emissionRate: options.emissionRate ?? 3,
      particleLifetime: options.particleLifetime ?? 4,
      initialSize: options.initialSize ?? 0.8,
      finalSize: options.finalSize ?? 4,
      color: options.color ?? new THREE.Color(0xcccccc),
      maxParticles: options.maxParticles ?? 80,
      turbulence: options.turbulence ?? 0.5,
      enabled: options.enabled ?? true,
    };

    // Create shared material for all smoke particles
    this.material = new THREE.MeshStandardMaterial({
      color: this.options.color,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Pre-create particle pool
    this.initializeParticlePool();
  }

  /**
   * Initialize pool of reusable particles
   */
  private initializeParticlePool(): void {
    const geometry = resourceManager.getOrCreateGeometry(
      'smoke_particle',
      () => new THREE.SphereGeometry(1, 8, 6)
    );

    this.mesh = new THREE.InstancedMesh(geometry, this.material, this.options.maxParticles);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Particles drift far from the origin of the instanced mesh, so its bounds never fit them.
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.group.add(this.mesh);

    for (let i = 0; i < this.options.maxParticles; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        size: 0,
        velocity: new THREE.Vector3(),
        age: 0,
        lifetime: 0,
        initialSize: this.options.initialSize,
        finalSize: this.options.finalSize,
        active: false,
      });
    }
  }

  /**
   * Emit a new smoke particle at the given position
   */
  private emitParticle(position: THREE.Vector3, velocity: THREE.Vector3): void {
    // Find inactive particle
    const particle = this.particles.find(p => !p.active);
    if (!particle) return;

    // Activate particle
    particle.active = true;
    particle.age = 0;
    particle.lifetime = this.options.particleLifetime * (0.8 + Math.random() * 0.4);
    particle.initialSize = this.options.initialSize * (0.8 + Math.random() * 0.4);
    particle.finalSize = this.options.finalSize * (0.8 + Math.random() * 0.4);

    // Set position, with some random offset
    particle.position.copy(position);
    particle.position.x += (Math.random() - 0.5) * 2;
    particle.position.y += (Math.random() - 0.5) * 2;
    particle.position.z += (Math.random() - 0.5) * 2;

    // Set velocity (inherit aircraft velocity + turbulence)
    particle.velocity.copy(velocity);
    particle.velocity.multiplyScalar(0.3); // Smoke slower than plane
    particle.velocity.x += (Math.random() - 0.5) * this.options.turbulence;
    particle.velocity.y += Math.random() * this.options.turbulence * 0.5; // Slight upward drift
    particle.velocity.z += (Math.random() - 0.5) * this.options.turbulence;

    particle.size = particle.initialSize;
  }

  /**
   * Update smoke trail
   */
  public update(deltaTime: number, emitterPosition: THREE.Vector3, emitterVelocity: THREE.Vector3): void {
    if (!this.options.enabled) return;

    // Emit new particles
    this.timeSinceLastEmission += deltaTime;
    const emissionInterval = 1 / this.options.emissionRate;

    while (this.timeSinceLastEmission >= emissionInterval) {
      this.emitParticle(emitterPosition, emitterVelocity);
      this.timeSinceLastEmission -= emissionInterval;
    }

    // Update existing particles, packing the live ones into the first instances
    let count = 0;
    for (const particle of this.particles) {
      if (!particle.active) continue;

      // Age particle
      particle.age += deltaTime;

      // Deactivate if lifetime exceeded
      if (particle.age >= particle.lifetime) {
        particle.active = false;
        continue;
      }

      // Calculate lifecycle progress (0 to 1)
      const progress = particle.age / particle.lifetime;

      // Update position with velocity and drag
      particle.position.addScaledVector(particle.velocity, deltaTime);

      // Apply drag (smoke slows down)
      particle.velocity.multiplyScalar(0.98);

      // Scale grows over time
      particle.size = THREE.MathUtils.lerp(particle.initialSize, particle.finalSize, progress);

      this.matrix.compose(particle.position, this.rotation, this.scale.setScalar(particle.size));
      this.mesh.setMatrixAt(count++, this.matrix);
    }

    this.mesh.count = count;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Set emission enabled/disabled
   */
  public setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
  }

  /**
   * Get the THREE.Group containing all smoke particles
   */
  public getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * Clear all active particles
   */
  public clear(): void {
    for (const particle of this.particles) {
      particle.active = false;
    }
    this.mesh.count = 0;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.clear();
    this.material.dispose();
    this.mesh.dispose();
  }
}
