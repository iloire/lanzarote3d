import * as THREE from 'three';
import { SimpleThreeComponent, SimpleComponentOptions } from '../../base/SimpleThreeComponent';
import { ComponentMetadata } from '../../base/IThreeComponent';
import { resourceManager } from '../../../systems/ResourceManager';

export interface HerculesOptions extends SimpleComponentOptions {
  bodyColor?: string;
  wingColor?: string;
  propellerColor?: string;
  windowColor?: string;
  stripeColor?: string;
  scale?: number;
  showCargoDoor?: boolean;
}

/**
 * Hercules C-130 - legendary four-engine military transport aircraft
 *
 * The C-130 Hercules is one of the most versatile and widely used military
 * transport aircraft in history. Known for its rugged design, four turboprop
 * engines, and distinctive high-wing configuration.
 */
export class Hercules extends SimpleThreeComponent {
  constructor(options: HerculesOptions = {}) {
    const metadata: ComponentMetadata = {
      name: 'Hercules C-130',
      version: '1.0.0',
      description: 'Four-engine military transport aircraft with distinctive high-wing design',
      tags: ['vehicle', 'aircraft', 'hercules', 'c130', 'military', 'transport', 'cargo'],
    };

    super(metadata, {
      bodyColor: '#5A6268', // Military gray
      wingColor: '#4A5158', // Darker gray for wings
      propellerColor: '#2C3E50', // Dark blue-gray
      windowColor: '#87CEEB', // Sky blue
      stripeColor: '#FFD700', // Gold stripe
      scale: 1,
      showCargoDoor: true,
      ...options,
    });
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override createContent(): THREE.Object3D {
    const hercules = new THREE.Group();
    hercules.name = 'Hercules-C130';

    const options = this.options as HerculesOptions;
    const scale = options.scale || 1;

    // Create materials
    const bodyMaterial = resourceManager.getOrCreateMaterial(
      `hercules_body_${options.bodyColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.bodyColor,
        metalness: 0.5,
        roughness: 0.6
      })
    );

    const wingMaterial = resourceManager.getOrCreateMaterial(
      `hercules_wing_${options.wingColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.wingColor,
        metalness: 0.4,
        roughness: 0.7
      })
    );

    const propellerMaterial = resourceManager.getOrCreateMaterial(
      `hercules_propeller_${options.propellerColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.propellerColor,
        metalness: 0.7,
        roughness: 0.3
      })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `hercules_window_${options.windowColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.windowColor,
        transparent: true,
        opacity: 0.5,
        metalness: 0.8,
        roughness: 0.1
      })
    );

    const stripeMaterial = resourceManager.getOrCreateMaterial(
      `hercules_stripe_${options.stripeColor}`,
      () => new THREE.MeshStandardMaterial({
        color: options.stripeColor,
        metalness: 0.5,
        roughness: 0.4
      })
    );

    const darkMaterial = new THREE.MeshStandardMaterial({
      color: '#1A1A1A',
      metalness: 0.3,
      roughness: 0.8
    });

    // Main fuselage (large cargo body)
    const fuselageGeometry = new THREE.BoxGeometry(20, 4, 4);
    const fuselage = new THREE.Mesh(fuselageGeometry, bodyMaterial);
    fuselage.position.set(0, 0, 0);
    fuselage.castShadow = this.options.castShadow ?? true;
    fuselage.receiveShadow = this.options.receiveShadow ?? true;
    hercules.add(fuselage);

    // Nose section (cockpit area)
    const noseGeometry = new THREE.BoxGeometry(4, 3.5, 3.5);
    const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
    nose.position.set(12, 0.25, 0);
    nose.castShadow = this.options.castShadow ?? true;
    hercules.add(nose);

    // Cockpit windows (distinctive upward-angled nose)
    const cockpitWindowGeometry = new THREE.BoxGeometry(0.2, 2, 2.5);
    const cockpitWindow = new THREE.Mesh(cockpitWindowGeometry, windowMaterial);
    cockpitWindow.position.set(13.5, 0.5, 0);
    hercules.add(cockpitWindow);

    // Side cockpit windows
    const sideWindowGeometry = new THREE.BoxGeometry(2, 1, 0.1);
    const leftCockpitWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftCockpitWindow.position.set(12, 1, 1.8);
    hercules.add(leftCockpitWindow);

    const rightCockpitWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightCockpitWindow.position.set(12, 1, -1.8);
    hercules.add(rightCockpitWindow);

    // Small side windows along fuselage
    for (let i = 0; i < 3; i++) {
      const smallWindowGeometry = new THREE.BoxGeometry(1, 0.6, 0.1);
      const leftWindow = new THREE.Mesh(smallWindowGeometry, windowMaterial);
      leftWindow.position.set(8 - i * 4, 1.5, 2.05);
      hercules.add(leftWindow);

      const rightWindow = new THREE.Mesh(smallWindowGeometry, windowMaterial);
      rightWindow.position.set(8 - i * 4, 1.5, -2.05);
      hercules.add(rightWindow);
    }

    // Decorative military stripe
    const stripeGeometry = new THREE.BoxGeometry(18, 0.3, 0.1);
    const leftStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    leftStripe.position.set(1, 0.5, 2.06);
    hercules.add(leftStripe);

    const rightStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    rightStripe.position.set(1, 0.5, -2.06);
    hercules.add(rightStripe);

    // Cargo door markings (if enabled)
    if (options.showCargoDoor) {
      const cargoDoorGeometry = new THREE.BoxGeometry(0.1, 3.5, 3.5);
      const cargoDoorMaterial = new THREE.MeshStandardMaterial({
        color: '#3A4148',
        metalness: 0.6,
        roughness: 0.5
      });
      const cargoDoor = new THREE.Mesh(cargoDoorGeometry, cargoDoorMaterial);
      cargoDoor.position.set(-10, -0.25, 0);
      hercules.add(cargoDoor);
    }

    // Main wings (high-wing configuration - signature of C-130)
    const wingGeometry = new THREE.BoxGeometry(5, 0.5, 30);
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(2, 2.5, 0); // Positioned high above fuselage
    wings.castShadow = this.options.castShadow ?? true;
    hercules.add(wings);

    // Wing fillets (fairings connecting wings to fuselage)
    const filletGeometry = new THREE.BoxGeometry(3, 2, 4);
    const leftFillet = new THREE.Mesh(filletGeometry, bodyMaterial);
    leftFillet.position.set(2, 1.5, 8);
    hercules.add(leftFillet);

    const rightFillet = new THREE.Mesh(filletGeometry, bodyMaterial);
    rightFillet.position.set(2, 1.5, -8);
    hercules.add(rightFillet);

    // Tail section
    const tailGeometry = new THREE.BoxGeometry(4, 3, 3);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(-11, 1, 0);
    tail.castShadow = this.options.castShadow ?? true;
    hercules.add(tail);

    // Vertical stabilizer (tall tail fin)
    const verticalStabGeometry = new THREE.BoxGeometry(0.5, 5, 3);
    const verticalStab = new THREE.Mesh(verticalStabGeometry, wingMaterial);
    verticalStab.position.set(-12, 3.5, 0);
    verticalStab.castShadow = this.options.castShadow ?? true;
    hercules.add(verticalStab);

    // Horizontal stabilizers
    const horizontalStabGeometry = new THREE.BoxGeometry(3, 0.3, 10);
    const horizontalStab = new THREE.Mesh(horizontalStabGeometry, wingMaterial);
    horizontalStab.position.set(-12, 1.5, 0);
    horizontalStab.castShadow = this.options.castShadow ?? true;
    hercules.add(horizontalStab);

    // Create 4 engines with propellers (signature feature)
    const enginePositions = [
      { x: 2, z: -15 },  // Left outer
      { x: 2, z: -9 },   // Left inner
      { x: 2, z: 9 },    // Right inner
      { x: 2, z: 15 }    // Right outer
    ];

    enginePositions.forEach(pos => {
      // Engine nacelle
      const engineGeometry = new THREE.CylinderGeometry(0.9, 0.9, 2.5, 12);
      const engine = new THREE.Mesh(engineGeometry, propellerMaterial);
      engine.rotation.z = Math.PI / 2;
      engine.position.set(pos.x, 2.5, pos.z);
      engine.castShadow = this.options.castShadow ?? true;
      hercules.add(engine);

      // Engine intake (front)
      const intakeGeometry = new THREE.CylinderGeometry(1.1, 0.9, 0.5, 12);
      const intake = new THREE.Mesh(intakeGeometry, darkMaterial);
      intake.rotation.z = Math.PI / 2;
      intake.position.set(pos.x + 1.5, 2.5, pos.z);
      hercules.add(intake);

      // 4-blade propeller for each engine
      const bladeGeometry = new THREE.BoxGeometry(0.3, 4, 0.5);

      for (let i = 0; i < 4; i++) {
        const blade = new THREE.Mesh(bladeGeometry, propellerMaterial);
        blade.position.set(pos.x + 2.2, 2.5, pos.z);
        blade.rotation.x = (i * Math.PI * 2) / 4; // Evenly space 4 blades
        hercules.add(blade);
      }

      // Propeller hub
      const hubGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      const hub = new THREE.Mesh(hubGeometry, propellerMaterial);
      hub.position.set(pos.x + 2.2, 2.5, pos.z);
      hercules.add(hub);

      // Engine mounting pylon
      const pylonGeometry = new THREE.BoxGeometry(1, 1.5, 1.5);
      const pylon = new THREE.Mesh(pylonGeometry, bodyMaterial);
      pylon.position.set(pos.x, 1.5, pos.z);
      hercules.add(pylon);
    });

    // Landing gear (robust military gear)
    const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: '#1A1A1A',
      metalness: 0.3,
      roughness: 0.7
    });

    const strutGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3);
    const strutMaterial = new THREE.MeshStandardMaterial({
      color: '#888888',
      metalness: 0.7,
      roughness: 0.3
    });

    // Main landing gear (dual wheels each side)
    const mainGearPositions = [
      { x: 0, z: -3 },   // Left main
      { x: 0, z: 3 },    // Right main
    ];

    mainGearPositions.forEach(pos => {
      // Strut
      const strut = new THREE.Mesh(strutGeometry, strutMaterial);
      strut.position.set(pos.x, -1.5, pos.z);
      hercules.add(strut);

      // Dual wheels
      for (let i = 0; i < 2; i++) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x + (i * 0.8 - 0.4), -3, pos.z);
        hercules.add(wheel);
      }
    });

    // Nose landing gear (dual wheels)
    const noseStrut = new THREE.Mesh(strutGeometry, strutMaterial);
    noseStrut.position.set(10, -1.5, 0);
    hercules.add(noseStrut);

    for (let i = 0; i < 2; i++) {
      const noseWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      noseWheel.rotation.z = Math.PI / 2;
      noseWheel.position.set(10 + (i * 0.6 - 0.3), -3, 0);
      noseWheel.scale.set(0.9, 0.9, 0.9);
      hercules.add(noseWheel);
    }

    // Apply scale
    if (scale !== 1) {
      hercules.scale.setScalar(scale);
    }

    return hercules;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as HerculesOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, unknown> {
    const options = this.options as HerculesOptions;

    return {
      name: 'Hercules C-130',
      version: '1.0.0',
      type: 'vehicle',
      subtype: 'aircraft',
      category: 'military_transport',
      engines: 4,
      propellerType: 'turboprop',
      bodyColor: options.bodyColor,
      wingColor: options.wingColor,
      scale: options.scale,
      showCargoDoor: options.showCargoDoor,
    };
  }
}

export default Hercules;
