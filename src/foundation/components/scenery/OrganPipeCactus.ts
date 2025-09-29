import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

export interface OrganPipeCactusOptions extends SimpleComponentOptions {
  bodyColor?: string;
  spineColor?: string;
  flowerColor?: string;
  scale?: number;
  pipeCount?: number;
}

/**
 * Organ Pipe Cactus component - Multiple vertical columns from base
 */
export class OrganPipeCactus extends SimpleThreeComponent {
  constructor(options: OrganPipeCactusOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'OrganPipeCactus',
      version: '1.0.0',
      description: 'Organ pipe cactus with multiple vertical stems from ground level',
      tags: ['scenery', 'cactus', 'desert', 'plant', 'nature'],
    };

    super(metadata, {
      bodyColor: '#228B22', // Forest green
      spineColor: '#F0E68C', // Khaki color for spines
      flowerColor: '#E6E6FA', // Lavender for flowers
      scale: 1,
      pipeCount: 8,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected createSyncContent(): THREE.Object3D {
    const cactus = new THREE.Group();
    cactus.name = 'OrganPipeCactus';

    const options = this.options as OrganPipeCactusOptions;
    const scale = options.scale || 1;
    const pipeCount = Math.max(3, Math.min(15, options.pipeCount || 8));

    // Create materials with resource sharing
    const cactusMaterial = resourceManager.getOrCreateMaterial(
      `organ_body_${options.bodyColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.bodyColor })
    );

    const spineMaterial = resourceManager.getOrCreateMaterial(
      `organ_spine_${options.spineColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.spineColor })
    );

    const flowerMaterial = resourceManager.getOrCreateMaterial(
      `organ_flower_${options.flowerColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.flowerColor })
    );

    // Create multiple vertical pipes of varying heights
    const pipePositions: Array<{x: number, z: number, height: number, radius: number}> = [];
    
    // Central tallest pipe
    pipePositions.push({ x: 0, z: 0, height: 12 + Math.random() * 4, radius: 1.2 });
    
    // Surrounding pipes in a naturalistic cluster
    for (let i = 1; i < pipeCount; i++) {
      const angle = (i / (pipeCount - 1)) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 2 + Math.random() * 2;
      const height = 8 + Math.random() * 8; // Varying heights
      const radius = 0.8 + Math.random() * 0.5;
      
      pipePositions.push({
        x: Math.cos(angle) * distance,
        z: Math.sin(angle) * distance,
        height: height,
        radius: radius
      });
    }

    // Create each pipe
    pipePositions.forEach((pipe, index) => {
      const segments = Math.floor(pipe.height / 2);
      
      // Create pipe with slight taper
      for (let i = 0; i < segments; i++) {
        const t = i / segments;
        const segmentHeight = 2;
        const radiusBottom = pipe.radius * (1 - t * 0.2);
        const radiusTop = pipe.radius * (1 - (t + 1/segments) * 0.2);
        
        const pipeGeometry = resourceManager.getOrCreateGeometry(
          `organ_pipe_${index}_${i}`,
          () => new THREE.CylinderGeometry(radiusTop, radiusBottom, segmentHeight, 12)
        );
        
        const pipeSegment = new THREE.Mesh(pipeGeometry, cactusMaterial);
        pipeSegment.position.set(
          pipe.x,
          i * segmentHeight + segmentHeight/2, // Already positioned correctly for ground level
          pipe.z
        );
        pipeSegment.castShadow = this.options.castShadow ?? true;
        pipeSegment.receiveShadow = this.options.receiveShadow ?? true;
        cactus.add(pipeSegment);
        
        // Add vertical ribs
        const ribCount = 12;
        for (let j = 0; j < ribCount; j++) {
          const ribAngle = (j / ribCount) * Math.PI * 2;
          
          const ribGeometry = resourceManager.getOrCreateGeometry(
            `organ_rib_${index}_${i}_${j}`,
            () => new THREE.BoxGeometry(0.08, segmentHeight, 0.2)
          );
          
          const rib = new THREE.Mesh(ribGeometry, cactusMaterial);
          rib.position.set(
            pipe.x + Math.cos(ribAngle) * (radiusBottom + 0.05),
            pipeSegment.position.y,
            pipe.z + Math.sin(ribAngle) * (radiusBottom + 0.05)
          );
          rib.rotation.y = ribAngle;
          cactus.add(rib);
          
          // Add spines along ribs
          if (i % 2 === 0 && j % 3 === 0) {
            const spineGeometry = resourceManager.getOrCreateGeometry(
              `organ_spine_${index}_${i}_${j}`,
              () => new THREE.ConeGeometry(0.05, 0.4, 4)
            );
            
            const spine = new THREE.Mesh(spineGeometry, spineMaterial);
            spine.position.copy(rib.position);
            spine.position.x += Math.cos(ribAngle) * 0.1;
            spine.position.z += Math.sin(ribAngle) * 0.1;
            spine.rotation.z = ribAngle;
            spine.rotation.x = -Math.PI / 2;
            cactus.add(spine);
          }
        }
      }
      
      // Add flowers at the top of some pipes
      if (index % 2 === 0) {
        const flowerCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < flowerCount; i++) {
          const flowerAngle = (i / flowerCount) * Math.PI * 2;
          
          // Flower petals
          const flowerGeometry = resourceManager.getOrCreateGeometry(
            `organ_flower_${index}_${i}`,
            () => new THREE.ConeGeometry(0.25, 0.6, 5)
          );
          
          const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
          flower.position.set(
            pipe.x + Math.cos(flowerAngle) * pipe.radius * 0.6,
            pipe.height - 0.5,
            pipe.z + Math.sin(flowerAngle) * pipe.radius * 0.6
          );
          flower.rotation.z = flowerAngle * 0.3;
          cactus.add(flower);
        }
      }
    });

    // Add base ground detail
    const baseDetailMaterial = resourceManager.getOrCreateMaterial(
      'organ_base_detail',
      () => new THREE.MeshLambertMaterial({ color: '#8B7355' }) // Tan/sandy color
    );

    for (let i = 0; i < 8; i++) {
      const rockGeometry = resourceManager.getOrCreateGeometry(
        `organ_rock_${i}`,
        () => new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3)
      );
      
      const rock = new THREE.Mesh(rockGeometry, baseDetailMaterial);
      const angle = Math.random() * Math.PI * 2;
      const distance = 3 + Math.random() * 2;
      
      rock.position.set(
        Math.cos(angle) * distance,
        Math.random() * 0.2,
        Math.sin(angle) * distance
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.scale.set(
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5
      );
      cactus.add(rock);
    }

    // Apply scale
    if (scale !== 1) {
      cactus.scale.setScalar(scale);
    }

    return cactus;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as OrganPipeCactusOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    if (options.pipeCount && (options.pipeCount < 3 || options.pipeCount > 15)) {
      issues.push('Pipe count must be between 3 and 15');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as OrganPipeCactusOptions;

    return {
      name: 'OrganPipeCactus',
      version: '1.0.0',
      type: 'cactus',
      subtype: 'organ_pipe',
      bodyColor: options.bodyColor,
      flowerColor: options.flowerColor,
      pipeCount: options.pipeCount,
      scale: options.scale,
    };
  }
}

// Legacy export for backward compatibility with old synchronous API
const OrganPipeCactusLegacy = OrganPipeCactus as any;

// Add legacy load method that returns mesh directly
OrganPipeCactusLegacy.prototype.load = function (): THREE.Object3D {
  return this.createSyncContent();
};

export default OrganPipeCactusLegacy;