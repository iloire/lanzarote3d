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
    // Apply platform control forces
    if (keysPressed.size > 0) {

      const force = 1450;

      const velocity = gliderBody.velocity;
      const breakForceMagnitude = 1200;

      const rollTorque = 0.4;

      gliderBody.angularVelocity.z *= 0.95;

      const rollTorqueMagnitude = 1000;


      if (keysPressed.has(KEY_MAPPING.RIGHT[0])) {
        console.log('right', force);

        // when the right key is pressed, the glider will experiment 
        // a drag force in the direction opposite to the movement to the right 
        const dragForce = velocity.negate().scale(breakForceMagnitude);
        const wingPosition = new THREE.Vector3(0, 0, 3);
        vectorVisualizer.updateRightBreakVector(wingPosition, dragForce);
        const rollAxis = gliderBody.vectorToWorldFrame(new CANNON.Vec3(0, 1, 0));
        gliderBody.applyTorque(
          rollAxis.scale(-rollTorqueMagnitude)
        );

      }


      // X-axis movement (left/right)
      if (keysPressed.has(KEY_MAPPING.LEFT[0])) {
        console.log('left', force);
        const dragForce = velocity.negate().scale(breakForceMagnitude);
        const wingPosition = new THREE.Vector3(0, 0, 3);
        vectorVisualizer.updateLeftBreakVector(wingPosition, dragForce);
        const rollAxis = gliderBody.vectorToWorldFrame(new CANNON.Vec3(0, 1, 0));
        gliderBody.applyTorque(
          rollAxis.scale(rollTorqueMagnitude)
        );
      }

      if (keysPressed.has(KEY_MAPPING.UP[0])) {
        console.log('up', force);
        // when the up key is pressed, the glider will experiment a lift force on the top side 
        const liftForceMagnitude = 1200;
        const liftForce = new CANNON.Vec3(0, liftForceMagnitude, 0);

        gliderBody.applyForce(
          liftForce,
          new CANNON.Vec3(0, 0, 0)
        );
      }

      if (keysPressed.has(KEY_MAPPING.DOWN[0])) {
        console.log('down', -force);
        gliderBody.applyForce(
          new CANNON.Vec3(0, -force, 0),
          new CANNON.Vec3(0, 0, 0)
        );
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