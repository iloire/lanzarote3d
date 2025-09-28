import * as THREE from 'three';

/**
 * WindVisualization - 3D wind direction and speed visualization
 *
 * Features:
 * - Wind direction arrows across the terrain
 * - Wind speed color coding
 * - Dynamic particle system for wind flow
 * - Terrain-aware placement
 */
export class WindVisualization {
  private scene: THREE.Scene;
  private windArrows: THREE.Group | undefined;
  private windParticles: THREE.Points | undefined;
  private isVisible = true;
  private currentWindDirection = 0;
  private currentWindSpeed = 0;

  // Wind visualization parameters
  private readonly ARROW_COUNT = 25;
  private readonly ARROW_SPACING = 800;
  private readonly PARTICLE_COUNT = 500;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createWindVisualization();
  }

  private createWindVisualization(): void {
    this.createWindArrows();
    this.createWindParticles();
  }

  private createWindArrows(): void {
    this.windArrows = new THREE.Group();

    // Create a grid of wind arrows across the terrain
    const gridSize = Math.sqrt(this.ARROW_COUNT);
    const spacing = this.ARROW_SPACING;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i - gridSize / 2) * spacing;
        const z = (j - gridSize / 2) * spacing;
        const y = 100; // Height above terrain

        const arrow = this.createWindArrow();
        arrow.position.set(x, y, z);
        this.windArrows.add(arrow);
      }
    }

    this.scene.add(this.windArrows);
  }

  private createWindArrow(): THREE.Group {
    const arrowGroup = new THREE.Group();

    // Arrow shaft
    const shaftGeometry = new THREE.CylinderGeometry(5, 5, 80, 6);
    const shaftMaterial = new THREE.MeshLambertMaterial({
      color: 0x4444ff,
      transparent: true,
      opacity: 0.7,
    });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    arrowGroup.add(shaft);

    // Arrow head
    const headGeometry = new THREE.ConeGeometry(15, 30, 6);
    const headMaterial = new THREE.MeshLambertMaterial({
      color: 0x6666ff,
      transparent: true,
      opacity: 0.8,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 55;
    arrowGroup.add(head);

    // Wind speed indicator rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(20 + i * 8, 2, 4, 8);
      const ringMaterial = new THREE.MeshLambertMaterial({
        color: 0x8888ff,
        transparent: true,
        opacity: 0.3,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = -20 - i * 15;
      ring.userData.speedRing = i; // For speed-based scaling
      arrowGroup.add(ring);
    }

    // Rotate to horizontal
    arrowGroup.rotation.z = -Math.PI / 2;

    return arrowGroup;
  }

  private createWindParticles(): void {
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.PARTICLE_COUNT * 3);
    const velocities = new Float32Array(this.PARTICLE_COUNT * 3);
    const colors = new Float32Array(this.PARTICLE_COUNT * 3);

    // Initialize particles across the terrain
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Random position across terrain
      positions[i3] = (Math.random() - 0.5) * 8000; // X
      positions[i3 + 1] = Math.random() * 200 + 50; // Y (height above terrain)
      positions[i3 + 2] = (Math.random() - 0.5) * 8000; // Z

      // Initial velocity (will be updated based on wind)
      velocities[i3] = 0;
      velocities[i3 + 1] = 0;
      velocities[i3 + 2] = 0;

      // White particles
      colors[i3] = 1.0;
      colors[i3 + 1] = 1.0;
      colors[i3 + 2] = 1.0;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    this.windParticles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.windParticles);
  }

  public updateWindDirection(direction: number, speed: number): void {
    this.currentWindDirection = direction;
    this.currentWindSpeed = speed;

    this.updateArrows();
    this.updateParticles();
  }

  private updateArrows(): void {
    if (!this.windArrows) return;

    const windRadians = (this.currentWindDirection * Math.PI) / 180;
    const speedNormalized = Math.min(this.currentWindSpeed / 40, 1); // Normalize to 0-1

    this.windArrows.children.forEach(arrow => {
      if (arrow instanceof THREE.Group) {
        // Rotate arrow to point in wind direction
        arrow.rotation.y = windRadians;

        // Update color based on wind speed
        const color = this.getWindSpeedColor(this.currentWindSpeed);

        arrow.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            if (child.material instanceof THREE.MeshLambertMaterial) {
              child.material.color.setHex(color);
            }

            // Scale speed rings based on wind speed
            if (child.userData.speedRing !== undefined) {
              const ringIndex = child.userData.speedRing;
              const targetScale = speedNormalized > ringIndex * 0.33 ? 1 : 0.3;
              child.scale.setScalar(targetScale);
            }
          }
        });
      }
    });
  }

  private updateParticles(): void {
    if (!this.windParticles) return;

    const geometry = this.windParticles.geometry;
    const velocities = geometry.getAttribute('velocity') as THREE.BufferAttribute;
    const colors = geometry.getAttribute('color') as THREE.BufferAttribute;

    const windRadians = (this.currentWindDirection * Math.PI) / 180;
    const windStrength = this.currentWindSpeed * 0.5; // Scale for particle movement

    // Update particle velocities and colors
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Set velocity based on wind direction and speed
      velocities.array[i3] = Math.cos(windRadians) * windStrength;
      velocities.array[i3 + 1] = Math.random() * 2 - 1; // Small vertical variation
      velocities.array[i3 + 2] = Math.sin(windRadians) * windStrength;

      // Color based on wind speed
      const speedColor = this.getWindSpeedColorNormalized(this.currentWindSpeed);
      colors.array[i3] = speedColor.r;
      colors.array[i3 + 1] = speedColor.g;
      colors.array[i3 + 2] = speedColor.b;
    }

    velocities.needsUpdate = true;
    colors.needsUpdate = true;
  }

  private getWindSpeedColor(speed: number): number {
    // Color coding: Blue (calm) -> Green (moderate) -> Yellow (strong) -> Red (dangerous)
    if (speed < 10) return 0x4444ff; // Blue
    if (speed < 20) return 0x44ff44; // Green
    if (speed < 30) return 0xffff44; // Yellow
    if (speed < 40) return 0xff8844; // Orange
    return 0xff4444; // Red
  }

  private getWindSpeedColorNormalized(speed: number): { r: number; g: number; b: number } {
    const color = new THREE.Color(this.getWindSpeedColor(speed));
    return { r: color.r, g: color.g, b: color.b };
  }

  public update(): void {
    if (!this.isVisible || !this.windParticles) return;

    // Animate particles
    const geometry = this.windParticles.geometry;
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    const velocities = geometry.getAttribute('velocity') as THREE.BufferAttribute;

    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Update positions based on velocities
      positions.array[i3] += velocities.array[i3] * 0.1;
      positions.array[i3 + 1] += velocities.array[i3 + 1] * 0.05;
      positions.array[i3 + 2] += velocities.array[i3 + 2] * 0.1;

      // Wrap particles around terrain bounds
      if (positions.array[i3] > 4000) positions.array[i3] = -4000;
      if (positions.array[i3] < -4000) positions.array[i3] = 4000;
      if (positions.array[i3 + 2] > 4000) positions.array[i3 + 2] = -4000;
      if (positions.array[i3 + 2] < -4000) positions.array[i3 + 2] = 4000;

      // Keep particles above terrain
      if (positions.array[i3 + 1] < 50) positions.array[i3 + 1] = 50;
      if (positions.array[i3 + 1] > 300) positions.array[i3 + 1] = 300;
    }

    positions.needsUpdate = true;

    // Animate arrow bobbing
    if (this.windArrows) {
      const time = Date.now() * 0.001;
      this.windArrows.children.forEach((arrow, index) => {
        if (arrow instanceof THREE.Group) {
          const bobAmount = Math.sin(time + index * 0.5) * 5;
          arrow.position.y = 100 + bobAmount;
        }
      });
    }
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;

    if (this.windArrows) {
      this.windArrows.visible = visible;
    }

    if (this.windParticles) {
      this.windParticles.visible = visible;
    }
  }

  public dispose(): void {
    if (this.windArrows) {
      this.windArrows.traverse(child => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      this.scene.remove(this.windArrows);
      this.windArrows = undefined;
    }

    if (this.windParticles) {
      if (this.windParticles.geometry) this.windParticles.geometry.dispose();
      if (this.windParticles.material) {
        if (Array.isArray(this.windParticles.material)) {
          this.windParticles.material.forEach(mat => mat.dispose());
        } else {
          this.windParticles.material.dispose();
        }
      }
      this.scene.remove(this.windParticles);
      this.windParticles = undefined;
    }
  }
}
