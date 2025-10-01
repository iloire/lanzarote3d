import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface CessnaOptions extends SimpleComponentOptions {
  bodyColor?: string;
  wingColor?: string;
  propellerColor?: string;
  windowColor?: string;
  stripeColor?: string;
  scale?: number;
}

/**
 * Cessna - small single-engine general aviation aircraft
 */
export class Cessna extends SimpleThreeComponent {
  constructor(options: CessnaOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Cessna',
      version: '1.0.0',
      description: 'Small single-engine general aviation aircraft',
      tags: ['vehicle', 'aircraft', 'cessna', 'general-aviation'],
    };

    super(metadata, {
      bodyColor: '#F4F4F4', // Off-white
      wingColor: '#E8E8E8', // Light gray
      propellerColor: '#2C3E50', // Dark blue-gray
      windowColor: '#87CEEB', // Sky blue
      stripeColor: '#FF4500', // Orange-red stripe
      scale: 1,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const cessna = new THREE.Group();
    cessna.name = 'Cessna';

    const options = this.options as CessnaOptions;
    const scale = options.scale || 1;

    // Create materials
    const bodyMaterial = resourceManager.getOrCreateMaterial(
      `cessna_body_${options.bodyColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.bodyColor,
        metalness: 0.4,
        roughness: 0.5
      })
    );

    const wingMaterial = resourceManager.getOrCreateMaterial(
      `cessna_wing_${options.wingColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.wingColor,
        metalness: 0.3,
        roughness: 0.6
      })
    );

    const propellerMaterial = resourceManager.getOrCreateMaterial(
      `cessna_propeller_${options.propellerColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.propellerColor,
        metalness: 0.7,
        roughness: 0.3
      })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `cessna_window_${options.windowColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.windowColor,
        transparent: true,
        opacity: 0.6,
        metalness: 0.8,
        roughness: 0.1
      })
    );

    const stripeMaterial = resourceManager.getOrCreateMaterial(
      `cessna_stripe_${options.stripeColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.stripeColor,
        metalness: 0.4,
        roughness: 0.5
      })
    );

    // Main fuselage (smaller, more compact)
    const fuselageGeometry = new THREE.BoxGeometry(8, 2, 2.5);
    const fuselage = new THREE.Mesh(fuselageGeometry, bodyMaterial);
    fuselage.position.set(0, 0, 0);
    fuselage.castShadow = this.options.castShadow ?? true;
    fuselage.receiveShadow = this.options.receiveShadow ?? true;
    cessna.add(fuselage);

    // Nose section (engine cowling)
    const noseGeometry = new THREE.BoxGeometry(2, 1.8, 2.3);
    const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
    nose.position.set(5, 0, 0);
    nose.castShadow = this.options.castShadow ?? true;
    cessna.add(nose);

    // Cockpit (cabin with windows)
    const cockpitGeometry = new THREE.BoxGeometry(3, 2.2, 2.5);
    const cockpit = new THREE.Mesh(cockpitGeometry, bodyMaterial);
    cockpit.position.set(1.5, 0.5, 0);
    cockpit.castShadow = this.options.castShadow ?? true;
    cessna.add(cockpit);

    // Windshield (front windows)
    const windshieldGeometry = new THREE.BoxGeometry(0.1, 1.5, 2);
    const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
    windshield.position.set(3, 0.5, 0);
    cessna.add(windshield);

    // Side windows
    const sideWindowGeometry = new THREE.BoxGeometry(2, 1, 0.1);

    const leftWindow1 = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftWindow1.position.set(2, 0.5, 1.3);
    cessna.add(leftWindow1);

    const leftWindow2 = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftWindow2.position.set(0, 0.5, 1.3);
    cessna.add(leftWindow2);

    const rightWindow1 = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightWindow1.position.set(2, 0.5, -1.3);
    cessna.add(rightWindow1);

    const rightWindow2 = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightWindow2.position.set(0, 0.5, -1.3);
    cessna.add(rightWindow2);

    // Decorative stripe
    const stripeGeometry = new THREE.BoxGeometry(7, 0.2, 0.1);
    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe.position.set(0.5, 0.3, 1.31);
    cessna.add(stripe);

    const stripeRight = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripeRight.position.set(0.5, 0.3, -1.31);
    cessna.add(stripeRight);

    // Main wings (high-wing configuration typical of Cessna)
    const wingGeometry = new THREE.BoxGeometry(2.5, 0.3, 12);
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(0, 1.5, 0); // Positioned high on fuselage
    wings.castShadow = this.options.castShadow ?? true;
    cessna.add(wings);

    // Wing struts (supporting wires from wing to fuselage)
    const strutGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2);
    const strutMaterial = new THREE.MeshStandardMaterial({
      color: '#888888',
      metalness: 0.8,
      roughness: 0.2
    });

    const leftStrut1 = new THREE.Mesh(strutGeometry, strutMaterial);
    leftStrut1.position.set(-0.5, 0.5, -4);
    leftStrut1.rotation.z = -0.3;
    cessna.add(leftStrut1);

    const leftStrut2 = new THREE.Mesh(strutGeometry, strutMaterial);
    leftStrut2.position.set(-0.5, 0.5, 4);
    leftStrut2.rotation.z = 0.3;
    cessna.add(leftStrut2);

    // Tail section
    const tailGeometry = new THREE.BoxGeometry(3, 1.5, 1.5);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(-4.5, 0.5, 0);
    tail.castShadow = this.options.castShadow ?? true;
    cessna.add(tail);

    // Vertical stabilizer (tail fin)
    const verticalStabGeometry = new THREE.BoxGeometry(0.3, 2.5, 2);
    const verticalStab = new THREE.Mesh(verticalStabGeometry, wingMaterial);
    verticalStab.position.set(-5.5, 1.5, 0);
    verticalStab.castShadow = this.options.castShadow ?? true;
    cessna.add(verticalStab);

    // Horizontal stabilizers
    const horizontalStabGeometry = new THREE.BoxGeometry(1.5, 0.2, 4);
    const horizontalStab = new THREE.Mesh(horizontalStabGeometry, wingMaterial);
    horizontalStab.position.set(-5.5, 0.5, 0);
    horizontalStab.castShadow = this.options.castShadow ?? true;
    cessna.add(horizontalStab);

    // Engine (simple cylinder)
    const engineGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 12);
    const engine = new THREE.Mesh(engineGeometry, propellerMaterial);
    engine.rotation.z = Math.PI / 2;
    engine.position.set(6, 0, 0);
    engine.castShadow = this.options.castShadow ?? true;
    cessna.add(engine);

    // Propeller (3-blade)
    const bladeGeometry = new THREE.BoxGeometry(0.2, 3, 0.4);

    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(bladeGeometry, propellerMaterial);
      blade.position.set(6.8, 0, 0);
      blade.rotation.x = (i * Math.PI * 2) / 3; // Evenly space 3 blades
      cessna.add(blade);
    }

    // Propeller hub
    const hubGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const hub = new THREE.Mesh(hubGeometry, propellerMaterial);
    hub.position.set(6.8, 0, 0);
    cessna.add(hub);

    // Landing gear (fixed gear - typical of small Cessna)
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: '#1A1A1A',
      metalness: 0.3,
      roughness: 0.7
    });

    const strutMainGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5);

    // Left main gear
    const leftGearStrut = new THREE.Mesh(strutMainGeometry, strutMaterial);
    leftGearStrut.position.set(0.5, -1.5, -2);
    cessna.add(leftGearStrut);

    const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    leftWheel.rotation.z = Math.PI / 2;
    leftWheel.position.set(0.5, -2.3, -2);
    cessna.add(leftWheel);

    // Right main gear
    const rightGearStrut = new THREE.Mesh(strutMainGeometry, strutMaterial);
    rightGearStrut.position.set(0.5, -1.5, 2);
    cessna.add(rightGearStrut);

    const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rightWheel.rotation.z = Math.PI / 2;
    rightWheel.position.set(0.5, -2.3, 2);
    cessna.add(rightWheel);

    // Nose wheel
    const noseGearStrut = new THREE.Mesh(strutMainGeometry, strutMaterial);
    noseGearStrut.position.set(4.5, -1.5, 0);
    cessna.add(noseGearStrut);

    const noseWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    noseWheel.rotation.z = Math.PI / 2;
    noseWheel.position.set(4.5, -2.3, 0);
    noseWheel.scale.set(0.8, 0.8, 0.8); // Smaller nose wheel
    cessna.add(noseWheel);

    // Apply scale
    if (scale !== 1) {
      cessna.scale.setScalar(scale);
    }

    return cessna;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as CessnaOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as CessnaOptions;

    return {
      name: 'Cessna',
      version: '1.0.0',
      type: 'vehicle',
      subtype: 'aircraft',
      category: 'general_aviation',
      bodyColor: options.bodyColor,
      wingColor: options.wingColor,
      scale: options.scale,
    };
  }
}

export default Cessna;
