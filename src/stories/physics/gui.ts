import * as CANNON from "cannon-es";
import * as THREE from "three";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { VectorVisualizater } from "../../utils/vector-visualizer";
import { PhysicsObjects } from "./helpers";

/**
 * Physics control settings
 */
export interface PhysicsControlSettings {
  platformForce: number;
  sphereMass: number;
  isAutoRotate: boolean;
  autoRotateSpeed: number;
  resetScene: () => void;
  showVectors: boolean;
  vectorScale: number;
}

/**
 * Setup physics controls in the GUI
 */
export function setupPhysicsControls(
  gui: GUI,
  physicsObjects: PhysicsObjects,
  sphereBody: CANNON.Body,
  vectorVisualizer?: VectorVisualizater
): {
  controls: PhysicsControlSettings;
} {
  // Push force control settings
  const pushForceControl: PhysicsControlSettings = {
    platformForce: 1450,
    sphereMass: 50,
    isAutoRotate: false,
    autoRotateSpeed: 1,
    showVectors: true,
    vectorScale: 3.0,
    resetScene: () => {
      // Reset all bodies to their initial positions and velocities
      physicsObjects.bodies?.forEach((body) => {
        const initialPos = (body as any).initialPosition;
        const initialQuat = (body as any).initialQuaternion;

        if (initialPos && initialQuat) {
          body.position.copy(initialPos);
          body.quaternion.copy(initialQuat);
          body.velocity.set(0, 0, 0);
          body.angularVelocity.set(0, 0, 0);
        }
      });
    }
  };

  // Create a force control folder
  const forceControls = gui.addFolder("Force Controls");

  // Create a sphere control folder
  const sphereControls = gui.addFolder("Sphere Controls");
  sphereControls.add(pushForceControl, "sphereMass", 10, 200)
    .name("Sphere Mass")
    .onChange((value: number) => {
      sphereBody.mass = value;
      sphereBody.updateMassProperties();
    });

  // Create a camera control folder
  const cameraControls = gui.addFolder("Camera Controls");
  cameraControls.add(pushForceControl, "isAutoRotate").name("Auto Rotate");
  cameraControls.add(pushForceControl, "autoRotateSpeed", 0.1, 5).name("Rotation Speed");

  // Create a vector visualization folder if vectorVisualizer is provided
  if (vectorVisualizer) {
    const vectorControls = gui.addFolder("Vector Visualization");
    vectorControls.add(pushForceControl, "showVectors")
      .name("Show Force Vectors")
      .onChange((value: boolean) => {
        vectorVisualizer.setVisible(value);
      });

    vectorControls.add(pushForceControl, "vectorScale", 0.5, 10)
      .name("Vector Scale")
      .onChange((value: number) => {
        vectorVisualizer.setScale(value);
      });

    vectorControls.open();
  }

  // Add a reset button
  gui.add(pushForceControl, "resetScene").name("Reset Scene");

  // Open all folders
  forceControls.open();
  sphereControls.open();
  cameraControls.open();

  return { controls: pushForceControl };
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