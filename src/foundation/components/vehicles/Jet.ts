import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../base/SimpleThreeComponent';
import { ComponentMetadata } from '../base/IThreeComponent';
import { resourceManager } from '../../systems/ResourceManager';

export interface JetOptions extends SimpleComponentOptions {
  bodyColor?: string;
  wingColor?: string;
  cockpitColor?: string;
  engineColor?: string;
  scale?: number;
}

/**
 * Jet aircraft - fast military-style jet with swept wings
 */
export class Jet extends SimpleThreeComponent {
  constructor(options: JetOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Jet',
      version: '1.0.0',
      description: 'Military-style jet aircraft with swept wings and twin engines',
      tags: ['vehicle', 'aircraft', 'jet', 'military'],
    };

    super(metadata, {
      bodyColor: '#4A5568', // Dark gray
      wingColor: '#2D3748', // Darker gray
      cockpitColor: '#3B82F6', // Blue tinted glass
      engineColor: '#1A202C', // Very dark gray
      scale: 1,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const jet = new THREE.Group();
    jet.name = 'Jet';

    const options = this.options as JetOptions;
    const scale = options.scale || 1;

    // Create materials
    const bodyMaterial = resourceManager.getOrCreateMaterial(
      `jet_body_${options.bodyColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.bodyColor,
        metalness: 0.8,
        roughness: 0.3
      })
    );

    const wingMaterial = resourceManager.getOrCreateMaterial(
      `jet_wing_${options.wingColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.wingColor,
        metalness: 0.7,
        roughness: 0.4
      })
    );

    const cockpitMaterial = resourceManager.getOrCreateMaterial(
      `jet_cockpit_${options.cockpitColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.cockpitColor,
        transparent: true,
        opacity: 0.6,
        metalness: 0.9,
        roughness: 0.1
      })
    );

    const engineMaterial = resourceManager.getOrCreateMaterial(
      `jet_engine_${options.engineColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.engineColor,
        metalness: 0.9,
        roughness: 0.2
      })
    );

    // Main fuselage (sleek, elongated body)
    const fuselageGeometry = new THREE.CylinderGeometry(1.5, 1, 12, 8);
    const fuselage = new THREE.Mesh(fuselageGeometry, bodyMaterial);
    fuselage.rotation.z = Math.PI / 2; // Horizontal orientation
    fuselage.position.set(0, 0, 0);
    fuselage.castShadow = this.options.castShadow ?? true;
    fuselage.receiveShadow = this.options.receiveShadow ?? true;
    jet.add(fuselage);

    // Nose cone (pointed front)
    const noseGeometry = new THREE.ConeGeometry(1, 3, 8);
    const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
    nose.rotation.z = -Math.PI / 2; // Point forward
    nose.position.set(7.5, 0, 0);
    nose.castShadow = this.options.castShadow ?? true;
    jet.add(nose);

    // Cockpit canopy
    const cockpitGeometry = new THREE.SphereGeometry(1.2, 8, 8, 0, Math.PI);
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.rotation.z = -Math.PI / 2;
    cockpit.position.set(3, 1.2, 0);
    jet.add(cockpit);

    // Main wings (swept back design)
    const wingGeometry = new THREE.BoxGeometry(2, 0.3, 14);

    // Left wing
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-1, 0, -7);
    leftWing.rotation.x = -0.2; // Slight sweep back
    leftWing.castShadow = this.options.castShadow ?? true;
    jet.add(leftWing);

    // Right wing
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(-1, 0, 7);
    rightWing.rotation.x = 0.2; // Slight sweep back
    rightWing.castShadow = this.options.castShadow ?? true;
    jet.add(rightWing);

    // Tail fin (vertical stabilizer)
    const tailFinGeometry = new THREE.BoxGeometry(0.3, 3, 2);
    const tailFin = new THREE.Mesh(tailFinGeometry, wingMaterial);
    tailFin.position.set(-5, 1.5, 0);
    tailFin.castShadow = this.options.castShadow ?? true;
    jet.add(tailFin);

    // Horizontal stabilizers
    const stabilizerGeometry = new THREE.BoxGeometry(1.5, 0.2, 5);
    const stabilizer = new THREE.Mesh(stabilizerGeometry, wingMaterial);
    stabilizer.position.set(-5, 0, 0);
    stabilizer.castShadow = this.options.castShadow ?? true;
    jet.add(stabilizer);

    // Engines (twin engines under wings)
    const engineGeometry = new THREE.CylinderGeometry(0.6, 0.8, 3, 8);

    // Left engine
    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.rotation.z = Math.PI / 2;
    leftEngine.position.set(-2, -0.8, -3);
    leftEngine.castShadow = this.options.castShadow ?? true;
    jet.add(leftEngine);

    // Right engine
    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.rotation.z = Math.PI / 2;
    rightEngine.position.set(-2, -0.8, 3);
    rightEngine.castShadow = this.options.castShadow ?? true;
    jet.add(rightEngine);

    // Engine exhausts (glowing effect)
    const exhaustMaterial = new THREE.MeshBasicMaterial({
      color: '#FF6B00'
    });
    const exhaustGeometry = new THREE.CircleGeometry(0.7, 8);

    // Left exhaust
    const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    leftExhaust.position.set(-3.5, -0.8, -3);
    leftExhaust.rotation.y = Math.PI / 2;
    jet.add(leftExhaust);

    // Right exhaust
    const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    rightExhaust.position.set(-3.5, -0.8, 3);
    rightExhaust.rotation.y = Math.PI / 2;
    jet.add(rightExhaust);

    // Apply scale
    if (scale !== 1) {
      jet.scale.setScalar(scale);
    }

    return jet;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as JetOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as JetOptions;

    return {
      name: 'Jet',
      version: '1.0.0',
      type: 'vehicle',
      subtype: 'aircraft',
      category: 'military_jet',
      bodyColor: options.bodyColor,
      wingColor: options.wingColor,
      scale: options.scale,
    };
  }
}

export default Jet;
