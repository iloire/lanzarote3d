import * as THREE from 'three';
import { Bird, BirdOptions } from './Bird';
import { ComponentMetadata } from '../base/IThreeComponent';

export interface VultureOptions extends BirdOptions {
  neckLength?: number;
}

/**
 * Vulture - A large scavenging bird with dark plumage and characteristic bald head
 * Known for soaring abilities and efficient flight patterns
 */
export class Vulture extends Bird {
  constructor(options: VultureOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Vulture',
      version: '1.0.0',
      description: 'Large scavenging bird with excellent soaring abilities and bald head',
      tags: ['animals', 'bird', 'vulture', 'scavenger', 'soaring'],
    };

    super(metadata, {
      wingSpan: 2.8,
      bodyLength: 1.8,
      wingBeatFrequency: 1.2, // Vultures soar more than they flap
      wingBeatAmplitude: 0.4,
      neckLength: 1.0,
      ...options
    });
  }

  protected getModelScale(): number {
    return 1.0; // Medium-large size, between crow and eagle
  }

  protected getSpeciesColor(): number {
    return 0x2F2F2F; // Dark gray
  }

  protected applySpeciesColoring(model: THREE.Group): void {
    const bodyColor = new THREE.Color(0x2F2F2F); // Dark gray body
    const wingColor = new THREE.Color(0x1C1C1C); // Very dark gray/black wings
    const headColor = new THREE.Color(0xDC143C); // Red bald head
    const neckColor = new THREE.Color(0xF5DEB3); // Light brown neck
    const beakColor = new THREE.Color(0x696969); // Dark gray beak
    const eyeColor = new THREE.Color(0x800000); // Dark red eyes

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = Array.isArray(child.material)
          ? child.material[0] as THREE.MeshStandardMaterial
          : child.material as THREE.MeshStandardMaterial;

        if (child.name.toLowerCase().includes('head')) {
          // Characteristic bald red head
          material.color = headColor;
          material.metalness = 0.0;
          material.roughness = 0.95; // Very rough skin texture
        } else if (child.name.toLowerCase().includes('neck')) {
          // Light brown neck feathers
          material.color = neckColor;
          material.metalness = 0.0;
          material.roughness = 0.9;
        } else if (child.name.toLowerCase().includes('body') ||
                   child.name.toLowerCase().includes('chest')) {
          // Dark gray body
          material.color = bodyColor;
          material.metalness = 0.0;
          material.roughness = 0.85;
        } else if (child.name.toLowerCase().includes('wing') ||
                   child.name.toLowerCase().includes('tail')) {
          // Very dark wings for soaring silhouette
          material.color = wingColor;
          material.metalness = 0.0;
          material.roughness = 0.9;
        } else if (child.name.toLowerCase().includes('beak')) {
          // Dark gray hooked beak
          material.color = beakColor;
          material.metalness = 0.1;
          material.roughness = 0.7;
        } else if (child.name.toLowerCase().includes('eye')) {
          // Dark red eyes
          material.color = eyeColor;
          material.metalness = 0.0;
          material.roughness = 0.4;
        } else {
          // Default to body color
          material.color = bodyColor;
          material.metalness = 0.0;
          material.roughness = 0.85;
        }

        material.needsUpdate = true;
      }
    });
  }
}