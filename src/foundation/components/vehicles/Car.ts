import * as THREE from 'three';
import {
  MovableCarComponent,
  MovableCarComponentOptions,
} from '../base/MovableCarComponent';
import { resourceManager } from '../../systems/ResourceManager';
import { MovementPattern } from '../../systems/behaviors/MovingBehavior';

export interface CarOptions extends MovableCarComponentOptions {
  bodyColor?: string;
  roofColor?: string;
  windowColor?: string;
  wheelColor?: string;
  scale?: number;
}

/**
 * Car vehicle that can drive around with customizable colors
 * Based on MovableCarComponent for proper ground-based movement
 */
export class Car extends MovableCarComponent {
  constructor(options: CarOptions = {}) {
    super(
      {
        name: 'Car',
        version: '1.0.0',
        description: 'Car vehicle with movement and driving capabilities',
      },
      {
        // Default colors - classic red car
        bodyColor: '#CC0000',
        roofColor: '#990000',
        windowColor: '#87CEEB',
        wheelColor: '#222222',
        scale: 1,
        // Movement defaults
        pattern: MovementPattern.CIRCULAR,
        speed: 0.4,
        radius: 150,
        enableMovement: true,
        autoStartMoving: true,
        faceDirection: true,
        forwardAxis: 'x', // Cars move forward in +X direction
        ...options,
      }
    );
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Return placeholder - actual geometry created in createSyncContent
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    // Use the procedural car geometry creation
    return this.createCarGeometry();
  }

  private createCarGeometry(): THREE.Object3D {
    const car = new THREE.Group();
    car.name = 'Car';

    const options = this.options as CarOptions;
    const scale = options.scale || 1;

    // Create materials with resource sharing
    const bodyMaterial = resourceManager.getOrCreateMaterial(
      `car_body_${options.bodyColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.bodyColor })
    );

    const roofMaterial = resourceManager.getOrCreateMaterial(
      `car_roof_${options.roofColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.roofColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `car_window_${options.windowColor}`,
      () =>
        new THREE.MeshLambertMaterial({
          color: options.windowColor,
          transparent: true,
          opacity: 0.7,
        })
    );

    const wheelMaterial = resourceManager.getOrCreateMaterial(
      `car_wheel_${options.wheelColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wheelColor })
    );

    // Main body
    const bodyGeometry = resourceManager.getOrCreateGeometry(
      'car_body',
      () => new THREE.BoxGeometry(20, 6, 10)
    );
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 3, 0);
    body.castShadow = this.options.castShadow ?? true;
    body.receiveShadow = this.options.receiveShadow ?? true;
    car.add(body);

    // Roof/cabin
    const roofGeometry = resourceManager.getOrCreateGeometry(
      'car_roof',
      () => new THREE.BoxGeometry(12, 5, 9)
    );
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-2, 8.5, 0);
    roof.castShadow = this.options.castShadow ?? true;
    roof.receiveShadow = this.options.receiveShadow ?? true;
    car.add(roof);

    // Front windshield
    const windshieldGeometry = resourceManager.getOrCreateGeometry(
      'car_windshield',
      () => new THREE.BoxGeometry(0.3, 4, 8)
    );
    const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
    windshield.position.set(4, 8.5, 0);
    car.add(windshield);

    // Rear window
    const rearWindowGeometry = resourceManager.getOrCreateGeometry(
      'car_rear_window',
      () => new THREE.BoxGeometry(0.3, 4, 8)
    );
    const rearWindow = new THREE.Mesh(rearWindowGeometry, windowMaterial);
    rearWindow.position.set(-8, 8.5, 0);
    car.add(rearWindow);

    // Side windows
    const sideWindowGeometry = resourceManager.getOrCreateGeometry(
      'car_side_window',
      () => new THREE.BoxGeometry(10, 4, 0.3)
    );
    const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftWindow.position.set(-2, 8.5, 4.65);
    car.add(leftWindow);

    const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightWindow.position.set(-2, 8.5, -4.65);
    car.add(rightWindow);

    // Wheels
    const wheelGeometry = resourceManager.getOrCreateGeometry(
      'car_wheel',
      () => new THREE.CylinderGeometry(2.5, 2.5, 2, 8)
    );

    // Front wheels
    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.position.set(6, 0, 6);
    frontLeftWheel.rotation.x = Math.PI / 2;
    frontLeftWheel.castShadow = this.options.castShadow ?? true;
    car.add(frontLeftWheel);

    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.position.set(6, 0, -6);
    frontRightWheel.rotation.x = Math.PI / 2;
    frontRightWheel.castShadow = this.options.castShadow ?? true;
    car.add(frontRightWheel);

    // Rear wheels
    const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearLeftWheel.position.set(-6, 0, 6);
    rearLeftWheel.rotation.x = Math.PI / 2;
    rearLeftWheel.castShadow = this.options.castShadow ?? true;
    car.add(rearLeftWheel);

    const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearRightWheel.position.set(-6, 0, -6);
    rearRightWheel.rotation.x = Math.PI / 2;
    rearRightWheel.castShadow = this.options.castShadow ?? true;
    car.add(rearRightWheel);

    // Headlights
    const headlightMaterial = resourceManager.getOrCreateMaterial(
      'car_headlight',
      () => new THREE.MeshLambertMaterial({ color: '#FFFFFF' })
    );

    const headlightGeometry = resourceManager.getOrCreateGeometry(
      'car_headlight',
      () => new THREE.CylinderGeometry(1, 1, 0.5, 8)
    );

    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(10.5, 4, 3);
    leftHeadlight.rotation.z = Math.PI / 2;
    car.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(10.5, 4, -3);
    rightHeadlight.rotation.z = Math.PI / 2;
    car.add(rightHeadlight);

    // Apply scale
    if (scale !== 1) {
      car.scale.setScalar(scale);
    }

    return car;
  }


  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as CarOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as CarOptions;

    return {
      name: 'Car',
      version: '1.0.0',
      type: 'car',
      bodyColor: options.bodyColor,
      roofColor: options.roofColor,
      windowColor: options.windowColor,
      wheelColor: options.wheelColor,
      scale: options.scale,
      ...this.getMovementInfo(),
    };
  }
}

export default Car;
