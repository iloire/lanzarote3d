import * as THREE from 'three';
import Paraglider from '../../components/vehicles/aerial-sports/Paraglider';
import ParagliderVoxel from '../../components/vehicles/aerial-sports/ParagliderVoxel';

export interface ParagliderInputState {
  directionInput: number; // -1 to 1 (left to right)
  isLeftPressed: boolean;
  isRightPressed: boolean;
  rotationInertia: number;
  rollAngle: number;
}

/**
 * Vehicles that support manual flight control
 * Must have left(), right(), leftRelease(), rightRelease() methods
 */
type ControllableVehicle = Paraglider | ParagliderVoxel;

/**
 * ParagliderInputController handles keyboard/gamepad input for paraglider control
 * and calculates rotation/banking based on input and inertia.
 *
 * Separate from physics - this only handles input and rotation visualization.
 */
export class ParagliderInputController {
  private flyable: ControllableVehicle;
  private mesh: THREE.Object3D;

  // Input state
  private directionInput: number = 0;
  private isLeftPressed: boolean = false;
  private isRightPressed: boolean = false;

  // Rotation state
  private rotationInertia: number = 0;
  private rollAngleRadians: number = 0;

  // Configuration
  private wrapSpeed: number = 1;
  private maxRollAngle: number = 75; // degrees

  constructor(flyable: ControllableVehicle, mesh: THREE.Object3D) {
    this.flyable = flyable;
    this.mesh = mesh;
  }

  /**
   * Update rotation based on current input and inertia
   * Call this every frame with deltaTime
   */
  update(deltaTime: number): ParagliderInputState {
    const rotationSmoother = 0.08;
    const keyBreakMultiplier = 15;
    const passiveRecoveryMultiplier = 5;
    const turnMultiplier = THREE.MathUtils.clamp(deltaTime, 0, 0.07);

    // Handle digital input (keyboard)
    if (this.directionInput === 0) {
      if (this.isLeftPressed) {
        this.rotationInertia -= turnMultiplier * keyBreakMultiplier * rotationSmoother;
      } else if (this.isRightPressed) {
        this.rotationInertia += turnMultiplier * keyBreakMultiplier * rotationSmoother;
      } else if (Math.abs(this.rotationInertia) > 0) {
        // Passive recovery - gradually return to center
        this.rotationInertia -=
          passiveRecoveryMultiplier * turnMultiplier * (this.rotationInertia * rotationSmoother);
      }
    } else {
      // Handle analog input (gamepad)
      if (Math.sign(this.directionInput) !== Math.sign(this.rotationInertia)) {
        // Breaking against inertia - stronger input
        this.rotationInertia += 2 * turnMultiplier * this.directionInput * rotationSmoother;
      } else {
        this.rotationInertia += turnMultiplier * this.directionInput * rotationSmoother;
      }
    }

    // Clamp rotation inertia
    this.rotationInertia = THREE.MathUtils.clamp(this.rotationInertia, -50, 50);

    // Apply rotation to mesh
    this.applyRotation(this.rotationInertia * rotationSmoother, this.rotationInertia * 1.3);

    return {
      directionInput: this.directionInput,
      isLeftPressed: this.isLeftPressed,
      isRightPressed: this.isRightPressed,
      rotationInertia: this.rotationInertia,
      rollAngle: this.rollAngleRadians,
    };
  }

  /**
   * Apply rotation to mesh (yaw and roll/bank)
   */
  private applyRotation(yRotationIncrement: number, zAngle: number): void {
    const rotationValue = this.getRotationValue(this.wrapSpeed);
    const yRotation = this.mesh.rotation.y + -1 * yRotationIncrement * rotationValue;

    const validZAngle = THREE.MathUtils.clamp(zAngle, -1 * this.maxRollAngle, this.maxRollAngle);
    const zRotation = -1 * Math.abs(THREE.MathUtils.degToRad(validZAngle));

    this.rollAngleRadians = zRotation;
    this.mesh.rotation.set(0, yRotation, zRotation);
  }

  /**
   * Calculate rotation value based on wrap speed
   */
  private getRotationValue(wrapSpeed: number): number {
    const multiplier = THREE.MathUtils.smoothstep(wrapSpeed, 1, 10);
    return Math.PI / (60 - 50 * multiplier);
  }

  // Input methods - Analog (gamepad/joystick)
  setDirectionInput(direction: number): void {
    this.directionInput = THREE.MathUtils.clamp(direction, -1, 1);

    if (direction > 0) {
      this.flyable.right();
    } else if (direction < 0) {
      this.flyable.left();
    } else {
      this.flyable.rightRelease();
      this.flyable.leftRelease();
    }
  }

  // Input methods - Digital (keyboard)
  pressLeft(): void {
    this.isLeftPressed = true;
    this.flyable.left();
  }

  releaseLeft(): void {
    this.isLeftPressed = false;
    this.flyable.leftRelease();
  }

  pressRight(): void {
    this.isRightPressed = true;
    this.flyable.right();
  }

  releaseRight(): void {
    this.isRightPressed = false;
    this.flyable.rightRelease();
  }

  // Configuration
  setWrapSpeed(speed: number): void {
    this.wrapSpeed = speed;
  }

  setMaxRollAngle(angle: number): void {
    this.maxRollAngle = angle;
  }

  // State getters
  getRotationInertia(): number {
    return this.rotationInertia;
  }

  getRollAngle(): number {
    return this.rollAngleRadians;
  }

  getDirectionInput(): number {
    return this.directionInput;
  }

  reset(): void {
    this.directionInput = 0;
    this.isLeftPressed = false;
    this.isRightPressed = false;
    this.rotationInertia = 0;
    this.rollAngleRadians = 0;
    this.flyable.leftRelease();
    this.flyable.rightRelease();
  }
}
