import * as THREE from 'three';
import {
  MovableCarComponent,
  MovableCarComponentOptions,
} from '../base/MovableCarComponent';
import { resourceManager } from '../../systems/ResourceManager';
import { MovementPattern } from '../../systems/behaviors/MovingBehavior';

export interface TruckOptions extends MovableCarComponentOptions {
  cabColor?: string;
  bedColor?: string;
  windowColor?: string;
  wheelColor?: string;
  scale?: number;
}

/**
 * Truck vehicle that can drive around with customizable colors
 * Larger than a car with a cargo bed, based on MovableCarComponent
 */
export class Truck extends MovableCarComponent {
  constructor(options: TruckOptions = {}) {
    super(
      {
        name: 'Truck',
        version: '1.0.0',
        description: 'Truck vehicle with movement and driving capabilities',
      },
      {
        // Default colors - classic blue work truck
        cabColor: '#0066CC',
        bedColor: '#004499',
        windowColor: '#87CEEB',
        wheelColor: '#222222',
        scale: 1,
        // Movement defaults - trucks move slower than cars
        pattern: MovementPattern.PATROL,
        speed: 0.25,
        radius: 200,
        enableMovement: true,
        autoStartMoving: true,
        faceDirection: true,
        forwardAxis: 'x', // Trucks move forward in +X direction
        ...options,
      }
    );
  }

  protected createGeometry(): THREE.BufferGeometry {
    // Trucks use complex procedural geometry, not a simple BufferGeometry
    // Return a placeholder - actual geometry is created in the override createObject method
    return new THREE.BoxGeometry(1, 1, 1);
  }

  protected override async createObject(): Promise<THREE.Object3D> {
    // Use the procedural truck geometry creation
    return this.createTruckGeometry();
  }

  private createTruckGeometry(): THREE.Object3D {
    const truck = new THREE.Group();
    truck.name = 'Truck';

    const options = this.options as TruckOptions;
    const scale = options.scale || 1;

    // Create materials with resource sharing
    const cabMaterial = resourceManager.getOrCreateMaterial(
      `truck_cab_${options.cabColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.cabColor })
    );

    const bedMaterial = resourceManager.getOrCreateMaterial(
      `truck_bed_${options.bedColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.bedColor })
    );

    const windowMaterial = resourceManager.getOrCreateMaterial(
      `truck_window_${options.windowColor}`,
      () =>
        new THREE.MeshLambertMaterial({
          color: options.windowColor,
          transparent: true,
          opacity: 0.7,
        })
    );

    const wheelMaterial = resourceManager.getOrCreateMaterial(
      `truck_wheel_${options.wheelColor}`,
      () => new THREE.MeshLambertMaterial({ color: options.wheelColor })
    );

    // Truck cab (front part)
    const cabGeometry = resourceManager.getOrCreateGeometry(
      'truck_cab',
      () => new THREE.BoxGeometry(15, 8, 12)
    );
    const cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.set(5, 4, 0);
    cab.castShadow = this.options.castShadow ?? true;
    cab.receiveShadow = this.options.receiveShadow ?? true;
    truck.add(cab);

    // Truck bed (rear cargo area)
    const bedGeometry = resourceManager.getOrCreateGeometry(
      'truck_bed',
      () => new THREE.BoxGeometry(20, 6, 12)
    );
    const bed = new THREE.Mesh(bedGeometry, bedMaterial);
    bed.position.set(-10, 3, 0);
    bed.castShadow = this.options.castShadow ?? true;
    bed.receiveShadow = this.options.receiveShadow ?? true;
    truck.add(bed);

    // Truck bed walls
    const bedWallGeometry = resourceManager.getOrCreateGeometry(
      'truck_bed_wall',
      () => new THREE.BoxGeometry(20, 4, 1)
    );

    // Back wall
    const backWall = new THREE.Mesh(bedWallGeometry, bedMaterial);
    backWall.position.set(-10, 8, -6.5);
    backWall.castShadow = this.options.castShadow ?? true;
    truck.add(backWall);

    const frontWall = new THREE.Mesh(bedWallGeometry, bedMaterial);
    frontWall.position.set(-10, 8, 6.5);
    frontWall.castShadow = this.options.castShadow ?? true;
    truck.add(frontWall);

    // Side walls
    const sideWallGeometry = resourceManager.getOrCreateGeometry(
      'truck_bed_side_wall',
      () => new THREE.BoxGeometry(1, 4, 12)
    );

    const leftWall = new THREE.Mesh(sideWallGeometry, bedMaterial);
    leftWall.position.set(-20, 8, 0);
    leftWall.castShadow = this.options.castShadow ?? true;
    truck.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeometry, bedMaterial);
    rightWall.position.set(0, 8, 0);
    rightWall.castShadow = this.options.castShadow ?? true;
    truck.add(rightWall);

    // Front windshield
    const windshieldGeometry = resourceManager.getOrCreateGeometry(
      'truck_windshield',
      () => new THREE.BoxGeometry(0.3, 6, 10)
    );
    const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
    windshield.position.set(12.5, 6, 0);
    truck.add(windshield);

    // Side windows
    const sideWindowGeometry = resourceManager.getOrCreateGeometry(
      'truck_side_window',
      () => new THREE.BoxGeometry(12, 6, 0.3)
    );
    const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    leftWindow.position.set(5, 6, 6.15);
    truck.add(leftWindow);

    const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
    rightWindow.position.set(5, 6, -6.15);
    truck.add(rightWindow);

    // Wheels - trucks have bigger wheels
    const wheelGeometry = resourceManager.getOrCreateGeometry(
      'truck_wheel',
      () => new THREE.CylinderGeometry(3.5, 3.5, 2.5, 8)
    );

    // Front wheels
    const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontLeftWheel.position.set(8, 0, 7.5);
    frontLeftWheel.rotation.x = Math.PI / 2;
    frontLeftWheel.castShadow = this.options.castShadow ?? true;
    truck.add(frontLeftWheel);

    const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontRightWheel.position.set(8, 0, -7.5);
    frontRightWheel.rotation.x = Math.PI / 2;
    frontRightWheel.castShadow = this.options.castShadow ?? true;
    truck.add(frontRightWheel);

    // Rear wheels (dual wheels for trucks)
    const rearLeftWheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearLeftWheel1.position.set(-8, 0, 8);
    rearLeftWheel1.rotation.x = Math.PI / 2;
    rearLeftWheel1.castShadow = this.options.castShadow ?? true;
    truck.add(rearLeftWheel1);

    const rearLeftWheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearLeftWheel2.position.set(-8, 0, 6);
    rearLeftWheel2.rotation.x = Math.PI / 2;
    rearLeftWheel2.castShadow = this.options.castShadow ?? true;
    truck.add(rearLeftWheel2);

    const rearRightWheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearRightWheel1.position.set(-8, 0, -8);
    rearRightWheel1.rotation.x = Math.PI / 2;
    rearRightWheel1.castShadow = this.options.castShadow ?? true;
    truck.add(rearRightWheel1);

    const rearRightWheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearRightWheel2.position.set(-8, 0, -6);
    rearRightWheel2.rotation.x = Math.PI / 2;
    rearRightWheel2.castShadow = this.options.castShadow ?? true;
    truck.add(rearRightWheel2);

    // Headlights
    const headlightMaterial = resourceManager.getOrCreateMaterial(
      'truck_headlight',
      () => new THREE.MeshLambertMaterial({ color: '#FFFFFF' })
    );

    const headlightGeometry = resourceManager.getOrCreateGeometry(
      'truck_headlight',
      () => new THREE.CylinderGeometry(1.2, 1.2, 0.8, 8)
    );

    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(13, 5, 4);
    leftHeadlight.rotation.z = Math.PI / 2;
    truck.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(13, 5, -4);
    rightHeadlight.rotation.z = Math.PI / 2;
    truck.add(rightHeadlight);

    // Grille
    const grilleMaterial = resourceManager.getOrCreateMaterial(
      'truck_grille',
      () => new THREE.MeshLambertMaterial({ color: '#333333' })
    );

    const grilleGeometry = resourceManager.getOrCreateGeometry(
      'truck_grille',
      () => new THREE.BoxGeometry(0.5, 6, 8)
    );
    const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
    grille.position.set(12.75, 4, 0);
    truck.add(grille);

    // Apply scale
    if (scale !== 1) {
      truck.scale.setScalar(scale);
    }

    return truck;
  }

  /**
   * Load the component synchronously for backward compatibility
   */
  public override loadSync(): THREE.Object3D {
    const truck = this.createTruckGeometry();
    this._object = truck;
    this._isLoaded = true;

    // Start moving if enabled
    if ((this.options as TruckOptions).enableMovement && ((this.options as TruckOptions).autoStartMoving ?? true)) {
      this.startMoving();
    }

    return truck;
  }

  public override validate(): string[] {
    const issues: string[] = [];
    const options = this.options as TruckOptions;

    if (options.scale && options.scale <= 0) {
      issues.push('Scale must be greater than 0');
    }

    return issues;
  }

  public getInfo(): Record<string, any> {
    const options = this.options as TruckOptions;

    return {
      name: 'Truck',
      version: '1.0.0',
      type: 'truck',
      cabColor: options.cabColor,
      bedColor: options.bedColor,
      windowColor: options.windowColor,
      wheelColor: options.wheelColor,
      scale: options.scale,
      ...this.getMovementInfo(),
    };
  }
}

export default Truck;
