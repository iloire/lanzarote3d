import * as CANNON from "cannon-es";
import { KEY_MAPPING, arrayIncludes } from "./helpers";

/**
 * Interface for keyboard controller configuration
 */
export interface KeyboardControlConfig {
  resetSceneCallback: () => void;
  platformForce: number;
}

/**
 * Setup keyboard controls for the physics simulation
 */
export function setupKeyboardControls(
  platformBody: CANNON.Body,
  config: KeyboardControlConfig
): {
  keyDownListener: (event: KeyboardEvent) => void;
  keyUpListener: (event: KeyboardEvent) => void;
  applyInputForces: () => void;
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
  function applyInputForces() {
    // Apply platform control forces
    if (keysPressed.size > 0) {
      // X-axis movement (left/right)
      if (keysPressed.has(KEY_MAPPING.PLATFORM_LEFT[0])) {
        platformBody.applyForce(
          new CANNON.Vec3(-config.platformForce, 0, 0),
          new CANNON.Vec3(0, 0, 0)
        );
      }

      if (keysPressed.has(KEY_MAPPING.PLATFORM_RIGHT[0])) {
        platformBody.applyForce(
          new CANNON.Vec3(config.platformForce, 0, 0),
          new CANNON.Vec3(0, 0, 0)
        );
      }

      if (keysPressed.has(KEY_MAPPING.PLATFORM_UP[0])) {
        platformBody.applyForce(
          new CANNON.Vec3(0, config.platformForce, 0),
          new CANNON.Vec3(0, 0, 0)
        );
      }

      if (keysPressed.has(KEY_MAPPING.PLATFORM_DOWN[0])) {
        platformBody.applyForce(
          new CANNON.Vec3(0, -config.platformForce, 0),
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