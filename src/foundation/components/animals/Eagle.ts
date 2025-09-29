import * as THREE from 'three';
import { Bird, BirdOptions } from './Bird';
import { ComponentMetadata } from '../base/IThreeComponent';

export interface EagleOptions extends BirdOptions {
  featherDetail?: number;
}

/**
 * Eagle - A majestic large bird of prey with brown and white plumage
 * Largest and most powerful of the three bird species
 */
export class Eagle extends Bird {
  constructor(options: EagleOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Eagle',
      version: '1.0.0',
      description: 'Majestic large bird of prey with powerful wings and keen eyesight',
      tags: ['animals', 'bird', 'raptor', 'eagle', 'predator'],
    };

    super(metadata, {
      wingSpan: 3.0,
      bodyLength: 2.0,
      wingBeatFrequency: 1.5,
      wingBeatAmplitude: 0.8,
      featherDetail: 1.0,
      ...options
    });
  }

  protected getModelScale(): number {
    return 1.2; // Largest of the three birds
  }

  protected getSpeciesColor(): number {
    return 0x8B4513; // Saddle brown
  }

  protected applySpeciesColoring(model: THREE.Group): void {
    const bodyColor = new THREE.Color(0x8B4513); // Saddle brown
    const headColor = new THREE.Color(0xF5F5DC); // Beige/white head
    const wingColor = new THREE.Color(0x654321); // Dark brown wings
    const beakColor = new THREE.Color(0xFFD700); // Golden yellow beak
    const talonsColor = new THREE.Color(0x696969); // Dark gray talons
    const eyeColor = new THREE.Color(0xFFFF00); // Bright yellow eyes

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = Array.isArray(child.material)
          ? child.material[0] as THREE.MeshStandardMaterial
          : child.material as THREE.MeshStandardMaterial;

        if (child.name.toLowerCase().includes('head')) {
          // White/beige head like a bald eagle
          material.color = headColor;
          material.metalness = 0.0;
          material.roughness = 0.9;
        } else if (child.name.toLowerCase().includes('body') ||
                   child.name.toLowerCase().includes('chest')) {
          // Brown body
          material.color = bodyColor;
          material.metalness = 0.0;
          material.roughness = 0.8;
        } else if (child.name.toLowerCase().includes('wing') ||
                   child.name.toLowerCase().includes('tail')) {
          // Dark brown wings and tail
          material.color = wingColor;
          material.metalness = 0.0;
          material.roughness = 0.85;
        } else if (child.name.toLowerCase().includes('beak')) {
          // Golden yellow beak
          material.color = beakColor;
          material.metalness = 0.3;
          material.roughness = 0.4;
        } else if (child.name.toLowerCase().includes('talon') ||
                   child.name.toLowerCase().includes('claw')) {
          // Dark gray talons
          material.color = talonsColor;
          material.metalness = 0.2;
          material.roughness = 0.6;
        } else if (child.name.toLowerCase().includes('eye')) {
          // Bright yellow eyes
          material.color = eyeColor;
          material.metalness = 0.0;
          material.roughness = 0.3;
          material.emissive = new THREE.Color(0x332200); // Slight glow
        } else {
          // Default to body color for any other parts
          material.color = bodyColor;
          material.metalness = 0.0;
          material.roughness = 0.8;
        }

        material.needsUpdate = true;
      }
    });
  }
}