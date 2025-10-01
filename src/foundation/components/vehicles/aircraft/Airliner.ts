import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface AirlinerOptions extends SimpleComponentOptions {
  bodyColor?: string;
  wingColor?: string;
  windowColor?: string;
  engineColor?: string;
  stripeColor?: string;
  scale?: number;
}

/**
 * Commercial airliner - large passenger aircraft with wide body
 */
export class Airliner extends SimpleThreeComponent {
  constructor(options: AirlinerOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Airliner',
      version: '1.0.0',
      description: 'Commercial passenger airliner with wide body and twin engines',
      tags: ['vehicle', 'aircraft', 'airliner', 'commercial'],
    };

    super(metadata, {
      bodyColor: '#FFFFFF', // White
      wingColor: '#E5E5E5', // Light gray
      windowColor: '#4169E1', // Royal blue
      engineColor: '#808080', // Gray
      stripeColor: '#DC143C', // Crimson red stripe
      scale: 1,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const airliner = new THREE.Group();
    airliner.name = 'Airliner';

    const options = this.options as AirlinerOptions;
    const scale = options.scale || 1;

    // Create materials
    const bodyMaterial = resourceManager.getOrCreateMaterial(
      `airliner_body_${options.bodyColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.bodyColor,
        metalness: 0.6,
        roughness: 0.2
      })
    );

    const wingMaterial = resourceManager.getOrCreateMaterial(
      `airliner_wing_${options.wingColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.wingColor,
        metalness: 0.5,
        roughness: 0.3
      })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `airliner_window_${options.windowColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.windowColor,
        transparent: true,
        opacity: 0.7,
        metalness: 0.8,
        roughness: 0.1
      })
    );

    const engineMaterial = resourceManager.getOrCreateMaterial(
      `airliner_engine_${options.engineColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.engineColor,
        metalness: 0.8,
        roughness: 0.3
      })
    );

    const stripeMaterial = resourceManager.getOrCreateMaterial(
      `airliner_stripe_${options.stripeColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.stripeColor,
        metalness: 0.6,
        roughness: 0.2
      })
    );

    // Main fuselage (wide body)
    const fuselageGeometry = new THREE.CylinderGeometry(2, 2, 18, 16);
    const fuselage = new THREE.Mesh(fuselageGeometry, bodyMaterial);
    fuselage.rotation.z = Math.PI / 2; // Horizontal orientation
    fuselage.position.set(0, 0, 0);
    fuselage.castShadow = this.options.castShadow ?? true;
    fuselage.receiveShadow = this.options.receiveShadow ?? true;
    airliner.add(fuselage);

    // Nose cone (rounded with more segments for smoother shape)
    const noseGeometry = new THREE.SphereGeometry(2, 24, 24, 0, Math.PI * 0.6);
    const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
    nose.rotation.y = -Math.PI / 2;
    nose.position.set(9, 0, 0);
    nose.castShadow = this.options.castShadow ?? true;
    airliner.add(nose);

    // Cockpit windshield (distinctive angled windows)
    const windshieldGeometry = new THREE.BoxGeometry(2, 1.5, 3);
    const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
    windshield.position.set(10, 1, 0);
    windshield.rotation.z = -0.2; // Slight downward angle for realistic look
    airliner.add(windshield);

    // Side cockpit windows
    const sideWindowGeometry = new THREE.BoxGeometry(1, 1, 0.1);

    const leftCockpitWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftCockpitWindow.position.set(10, 0.7, 1.6);
    leftCockpitWindow.rotation.x = -0.2;
    airliner.add(leftCockpitWindow);

    const rightCockpitWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightCockpitWindow.position.set(10, 0.7, -1.6);
    rightCockpitWindow.rotation.x = -0.2;
    airliner.add(rightCockpitWindow);

    // Tail cone
    const tailGeometry = new THREE.ConeGeometry(2, 4, 16);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-11, 0, 0);
    tail.castShadow = this.options.castShadow ?? true;
    airliner.add(tail);

    // Decorative stripe along fuselage
    const stripeGeometry = new THREE.BoxGeometry(16, 0.3, 0.3);
    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe.position.set(0, 0, 2.1);
    airliner.add(stripe);

    // Windows (multiple small windows along fuselage)
    const windowGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.1);
    for (let i = -7; i < 8; i++) {
      if (i === 0) continue; // Skip middle for wing

      // Upper windows (left side)
      const windowTop = new THREE.Mesh(windowGeometry, windowMaterial);
      windowTop.position.set(i * 1.2, 0.8, 2.05);
      airliner.add(windowTop);

      // Lower windows (left side)
      const windowBottom = new THREE.Mesh(windowGeometry, windowMaterial);
      windowBottom.position.set(i * 1.2, -0.8, 2.05);
      airliner.add(windowBottom);

      // Upper windows (right side)
      const windowTopRight = new THREE.Mesh(windowGeometry, windowMaterial);
      windowTopRight.position.set(i * 1.2, 0.8, -2.05);
      airliner.add(windowTopRight);

      // Lower windows (right side)
      const windowBottomRight = new THREE.Mesh(windowGeometry, windowMaterial);
      windowBottomRight.position.set(i * 1.2, -0.8, -2.05);
      airliner.add(windowBottomRight);
    }

    // Main wings (straight commercial wings)
    const wingGeometry = new THREE.BoxGeometry(3, 0.4, 18);

    // Left wing
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(0, -0.5, -10);
    leftWing.castShadow = this.options.castShadow ?? true;
    airliner.add(leftWing);

    // Right wing
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0, -0.5, 10);
    rightWing.castShadow = this.options.castShadow ?? true;
    airliner.add(rightWing);

    // Tail fin (vertical stabilizer)
    const tailFinGeometry = new THREE.BoxGeometry(0.4, 5, 3);
    const tailFin = new THREE.Mesh(tailFinGeometry, wingMaterial);
    tailFin.position.set(-9, 2.5, 0);
    tailFin.castShadow = this.options.castShadow ?? true;
    airliner.add(tailFin);

    // Horizontal stabilizers
    const stabilizerGeometry = new THREE.BoxGeometry(2, 0.3, 7);
    const stabilizer = new THREE.Mesh(stabilizerGeometry, wingMaterial);
    stabilizer.position.set(-9, 0.5, 0);
    stabilizer.castShadow = this.options.castShadow ?? true;
    airliner.add(stabilizer);

    // Engines (large turbofan engines under wings)
    const engineBodyGeometry = new THREE.CylinderGeometry(1.2, 1.4, 4, 16);
    const engineFrontGeometry = new THREE.CylinderGeometry(1.5, 1.2, 0.5, 16);

    // Left engine
    const leftEngineBody = new THREE.Mesh(engineBodyGeometry, engineMaterial);
    leftEngineBody.rotation.z = Math.PI / 2;
    leftEngineBody.position.set(1, -2, -6);
    leftEngineBody.castShadow = this.options.castShadow ?? true;
    airliner.add(leftEngineBody);

    const leftEngineFront = new THREE.Mesh(engineFrontGeometry, engineMaterial);
    leftEngineFront.rotation.z = Math.PI / 2;
    leftEngineFront.position.set(3.2, -2, -6);
    airliner.add(leftEngineFront);

    // Right engine
    const rightEngineBody = new THREE.Mesh(engineBodyGeometry, engineMaterial);
    rightEngineBody.rotation.z = Math.PI / 2;
    rightEngineBody.position.set(1, -2, 6);
    rightEngineBody.castShadow = this.options.castShadow ?? true;
    airliner.add(rightEngineBody);

    const rightEngineFront = new THREE.Mesh(engineFrontGeometry, engineMaterial);
    rightEngineFront.rotation.z = Math.PI / 2;
    rightEngineFront.position.set(3.2, -2, 6);
    airliner.add(rightEngineFront);

    // Engine intake (dark center)
    const intakeMaterial = new THREE.MeshBasicMaterial({ color: '#1A1A1A' });
    const intakeGeometry = new THREE.CircleGeometry(1, 16);

    const leftIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
    leftIntake.position.set(3.7, -2, -6);
    leftIntake.rotation.y = Math.PI / 2;
    airliner.add(leftIntake);

    const rightIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
    rightIntake.position.set(3.7, -2, 6);
    rightIntake.rotation.y = Math.PI / 2;
    airliner.add(rightIntake);

    // Apply scale
    if (scale !== 1) {
      airliner.scale.setScalar(scale);
    }

    return airliner;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as AirlinerOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as AirlinerOptions;

    return {
      name: 'Airliner',
      version: '1.0.0',
      type: 'vehicle',
      subtype: 'aircraft',
      category: 'commercial_airliner',
      bodyColor: options.bodyColor,
      wingColor: options.wingColor,
      scale: options.scale,
    };
  }
}

export default Airliner;
