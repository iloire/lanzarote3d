import * as CANNON from "cannon-es";
import * as THREE from "three";
import { VectorVisualizater } from "../../utils/vector-visualizer";
import { KEY_MAPPING, arrayIncludes } from "./helpers";

/**
 * Interface for keyboard controller configuration
 */
export interface KeyboardControlConfig {
  resetSceneCallback: () => void;
}

/**
 * Setup keyboard controls for the physics simulation
 */
export function setupKeyboardControls(
  gliderBody: CANNON.Body,
  config: KeyboardControlConfig
): {
  keyDownListener: (event: KeyboardEvent) => void;
  keyUpListener: (event: KeyboardEvent) => void;
  applyInputForces: (vectorVisualizer: VectorVisualizater) => void;
  cleanup: () => void;
} {
  // Set to keep track of pressed keys
  const keysPressed = new Set<string>();

  // Event listeners for keyboard controls
  const keyDownListener = (event: KeyboardEvent) => {
    keysPressed.add(event.code);

    // Reset positions
    if (arrayIncludes(KEY_MAPPING.RESET_POSITION, event.code)) {
      config.resetSceneCallback();
    }
  };

  const keyUpListener = (event: KeyboardEvent) => {
    keysPressed.delete(event.code);
  };

  // Add event listeners
  window.addEventListener('keydown', keyDownListener);
  window.addEventListener('keyup', keyUpListener);

  // Function to apply forces based on keyboard input
  function applyInputForces(vectorVisualizer: VectorVisualizater) {
    const wingPosition = new THREE.Vector3().copy(gliderBody.position as any);
    const force = 1450;
    const velocity = gliderBody.velocity;
    const breakForceMagnitude = 1200;
    const rollTorqueMagnitude = 1200;

    gliderBody.angularVelocity.z *= 0.95; // dampen the rotation

    // Remove break forces when not active
    if (!keysPressed.has(KEY_MAPPING.RIGHT[0])) {
      vectorVisualizer.removeTorque("R-BREAK-ROLL");
    }

    if (!keysPressed.has(KEY_MAPPING.LEFT[0])) {
      vectorVisualizer.removeTorque("L-BREAK-ROLL");
    }

    // Show keyboard forces
    if (!keysPressed.has(KEY_MAPPING.UP[0]) && !keysPressed.has(KEY_MAPPING.DOWN[0])) {
      vectorVisualizer.removeForce("KEYBOARD UP");
      vectorVisualizer.removeForce("KEYBOARD DOWN");
    }

    // Apply active forces when keys are pressed
    if (keysPressed.size > 0) {

      const rollAxis = gliderBody.vectorToWorldFrame(new CANNON.Vec3(0, 1, 0));
      const localAxis = gliderBody.quaternion.vmult(rollAxis);

      if (keysPressed.has(KEY_MAPPING.RIGHT[0])) {
        vectorVisualizer.addTorque({
          name: "R-BREAK-ROLL",
          color: 0x00ffff, // Cyan
          position: wingPosition,
          axis: rollAxis,
          magnitude: rollTorqueMagnitude,
          scale: 0.01 * 0.2,
        });

        gliderBody.applyTorque(localAxis.scale(-rollTorqueMagnitude));
      }

      if (keysPressed.has(KEY_MAPPING.LEFT[0])) {
        vectorVisualizer.addTorque({
          name: "L-BREAK-ROLL",
          color: 0x00ffff, // Cyan
          position: wingPosition,
          axis: rollAxis,
          magnitude: -rollTorqueMagnitude,
          scale: 0.01 * 0.2,
        });
        gliderBody.applyTorque(localAxis.scale(rollTorqueMagnitude));
      }

      if (keysPressed.has(KEY_MAPPING.UP[0])) {
        const liftForce = new CANNON.Vec3(0, 1000, 0);
        vectorVisualizer.addForce({
          name: "KEYBOARD UP",
          color: 0x00ff00, // Green
          position: wingPosition,
          vector: liftForce,
          scale: 0.01 * 0.2,
        });

        gliderBody.applyForce(liftForce, new CANNON.Vec3(0, 0, 0));
      }

      if (keysPressed.has(KEY_MAPPING.DOWN[0])) {
        const liftForce = new CANNON.Vec3(0, -force, 0);
        vectorVisualizer.addForce({
          name: "KEYBOARD DOWN",
          color: 0x00ff00, // Green
          position: wingPosition,
          vector: liftForce,
          scale: 0.01 * 0.2,
        });

        gliderBody.applyForce(liftForce, new CANNON.Vec3(0, 0, 0));
      }
    }
  }

  // Cleanup function to remove event listeners
  function cleanup() {
    window.removeEventListener('keydown', keyDownListener);
    window.removeEventListener('keyup', keyUpListener);
  }

  return {
    keyDownListener,
    keyUpListener,
    applyInputForces,
    cleanup
  };
} 