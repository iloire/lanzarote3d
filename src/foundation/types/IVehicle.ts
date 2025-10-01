import * as THREE from 'three';

/**
 * Vehicle interface - defines the contract for all vehicle components
 *
 * This interface is implemented by both:
 * - Atomic vehicles (aircraft, ground vehicles) that extend SimpleThreeComponent
 * - Composite vehicles (paragliders, hanggliders) that compose multiple components
 *
 * All vehicles must provide these core methods for consistent usage across the application.
 */
export interface IVehicle {
  /**
   * Load and initialize the vehicle, returning its 3D representation
   * @returns Promise resolving to the loaded Three.js Object3D
   */
  load(): Promise<THREE.Object3D>;

  /**
   * Get the vehicle's 3D mesh/object
   * @throws Error if vehicle not loaded
   * @returns The loaded Three.js Object3D
   */
  getMesh(): THREE.Object3D;

  /**
   * Clean up resources and dispose of the vehicle
   */
  dispose(): void;
}

/**
 * Extended vehicle interface with GUI support
 *
 * Vehicles that support interactive GUI controls should implement this interface.
 */
export interface IVehicleWithGUI extends IVehicle {
  /**
   * Add GUI controls for this vehicle
   * @param gui The GUI instance (typically lil-gui or dat.gui)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addGuiControls(gui: any): void;
}
