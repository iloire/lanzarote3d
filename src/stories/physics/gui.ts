import * as CANNON from "cannon-es";
import * as THREE from "three";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { PhysicsObjects } from "./helpers";

/**
 * Interface for physics control settings
 */
export interface PhysicsControlSettings {
  pushForce: number;
  sphereMass: number;
  platformForce: number;
  isAutoRotate: boolean;
  autoRotateSpeed: number;
  resetScene: () => void;
}

/**
 * Creates physics controls in the GUI
 */
export function setupPhysicsControls(
  gui: GUI,
  physicsObjects: PhysicsObjects,
  sphere: CANNON.Body
): {
  folder: GUI;
  controls: PhysicsControlSettings;
} {
  // Create a folder in the GUI for physics controls
  const physicsFolder = gui.addFolder('Physics Controls');

  // Function to reset all objects to their initial positions
  function resetPositions() {
    if (!physicsObjects.initialPositions) return;

    physicsObjects.bodies.forEach((body, index) => {
      if (index < physicsObjects.initialPositions.length) {
        const initialPos = physicsObjects.initialPositions[index];
        body.position.copy(initialPos as any);
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.quaternion.set(0, 0, 0, 1);
      }
    });
  }

  // Create push force control object with defaults
  const pushForceControl: PhysicsControlSettings = {
    pushForce: 500,
    sphereMass: 150,
    platformForce: 500,
    isAutoRotate: true,
    autoRotateSpeed: 0.1,
    resetScene: resetPositions
  };

  // Add controls to GUI
  physicsFolder.add(pushForceControl, 'pushForce', 50, 1000)
    .name('Push Force');

  physicsFolder.add(pushForceControl, 'platformForce', 100, 2000)
    .name('Platform Force');

  const massController = physicsFolder.add(pushForceControl, 'sphereMass', 10, 300)
    .name('Sphere Mass');

  physicsFolder.add(pushForceControl, 'isAutoRotate')
    .name('Auto Rotate');

  physicsFolder.add(pushForceControl, 'autoRotateSpeed', 0.01, 0.5)
    .name('Rotation Speed');

  // Add reset button to GUI
  physicsFolder.add({ reset: resetPositions }, 'reset')
    .name('Reset Positions');

  // Add mass controller callback
  massController.onChange((value: number) => {
    // Update the sphere's mass when the slider changes
    sphere.mass = value;
    sphere.updateMassProperties();
  });

  // Open the folder by default
  physicsFolder.open();

  return {
    folder: physicsFolder,
    controls: pushForceControl
  };
}

/**
 * Store initial positions of physics bodies for reset functionality
 */
export function storeInitialPositions(physicsObjects: PhysicsObjects): void {
  physicsObjects.initialPositions = physicsObjects.bodies.map(body =>
    new THREE.Vector3().copy(body.position as any)
  );
}

/**
 * Helper to find a controller in a GUI folder by its property name
 */
export function findControllerByProperty(
  folder: GUI,
  propertyName: string
): { onChange: (callback: (value: any) => void) => void } | undefined {
  return folder.controllers.find(c => (c as any).property === propertyName) as any;
} 