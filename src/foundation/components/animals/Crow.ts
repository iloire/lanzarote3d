import * as THREE from 'three';
import { Bird, BirdOptions } from './Bird';
import { ComponentMetadata } from '../base/IThreeComponent';

export interface CrowOptions extends BirdOptions {
  glossiness?: number;
}

/**
 * Crow - A black corvid bird with glossy feathers
 * Smaller and more agile than eagles, with characteristic black coloring
 */
export class Crow extends Bird {
  constructor(options: CrowOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Crow',
      version: '1.0.0',
      description: 'Intelligent black corvid bird with glossy feathers',
      tags: ['animals', 'bird', 'corvid', 'crow', 'black'],
    };

    super(metadata, {
      wingSpan: 1.5,
      bodyLength: 0.8,
      wingBeatFrequency: 3.0,
      wingBeatAmplitude: 0.6,
      glossiness: 0.3,
      ...options
    });
  }

  protected getModelScale(): number {
    return 0.6; // Smaller than eagles and vultures
  }

  protected getSpeciesColor(): number {
    return 0x404040; // Lighter gray for better visibility
  }

  protected applySpeciesColoring(model: THREE.Group): void {
    const crowColor = new THREE.Color(0x0f0f0f); // Deep black
    const beakColor = new THREE.Color(0x333333); // Dark gray for beak
    const eyeColor = new THREE.Color(0x000000); // Black eyes

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = Array.isArray(child.material)
          ? child.material[0] as THREE.MeshStandardMaterial
          : child.material as THREE.MeshStandardMaterial;

        if (child.name.toLowerCase().includes('body') ||
            child.name.toLowerCase().includes('wing') ||
            child.name.toLowerCase().includes('tail')) {
          // Crow body with subtle glossy black finish
          material.color = crowColor;
          material.metalness = 0.2;
          material.roughness = 0.6; // Slightly glossy
        } else if (child.name.toLowerCase().includes('beak')) {
          material.color = beakColor;
          material.metalness = 0.1;
          material.roughness = 0.8;
        } else if (child.name.toLowerCase().includes('eye')) {
          material.color = eyeColor;
          material.metalness = 0.0;
          material.roughness = 1.0;
        } else {
          // Default to crow black for any other parts
          material.color = crowColor;
          material.metalness = 0.1;
          material.roughness = 0.7;
        }

        material.needsUpdate = true;
      }
    });
  }
}