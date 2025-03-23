import * as CANNON from "cannon-es";
import * as THREE from "three";

/**
 * Creates and manages an arrow helper to visualize a force
 */
export function createForceVisualization(
  scene: THREE.Scene,
  body: CANNON.Body,
  container: HTMLElement,
  camera?: THREE.Camera
): {
  update: (force: CANNON.Vec3, currentCamera?: THREE.Camera) => void;
  cleanup: () => void;
} {
  // Create arrow helper for force visualization
  const arrowHelper = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0), // Initial direction
    new THREE.Vector3(0, 0, 0), // Initial position
    5, // Length
    0x00ff00, // Color
    1, // Head length
    0.5 // Head width
  );
  scene.add(arrowHelper);

  // Create label for force vector
  const label = document.createElement('div');
  label.style.position = 'absolute';
  label.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  label.style.color = '#00ff00';
  label.style.padding = '5px 10px';
  label.style.borderRadius = '4px';
  label.style.fontFamily = 'monospace';
  label.style.fontSize = '14px';
  label.style.pointerEvents = 'none'; // Don't block mouse events
  label.style.zIndex = '1000'; // Ensure it's above other elements
  label.textContent = 'Force: (0, 0, 0)';
  container.appendChild(label);

  // Function to update arrow and label based on current force
  function update(force: CANNON.Vec3, currentCamera?: THREE.Camera) {
    const activeCamera = currentCamera || camera;

    // Skip update if the force is zero
    if (force.length() < 0.001) {
      arrowHelper.visible = false;
      label.style.display = 'none';
      return;
    }

    arrowHelper.visible = true;
    label.style.display = 'block';

    // Get body position
    const position = new THREE.Vector3().copy(body.position as any);

    // Get normalized force direction
    const forceDirection = new THREE.Vector3(force.x, force.y, force.z).normalize();

    // Scale arrow length based on force magnitude (with some normalization)
    const forceMagnitude = force.length();
    const arrowLength = Math.min(5, Math.max(2, forceMagnitude / 100)); // Clamp between 2-5 units

    // Update arrow
    arrowHelper.position.copy(position);
    arrowHelper.setDirection(forceDirection);
    arrowHelper.setLength(arrowLength, arrowLength * 0.2, arrowLength * 0.1);

    // Update label position - only if we have a camera
    if (activeCamera) {
      // Project body position to screen coordinates
      const bodyScreenPos = position.clone();
      bodyScreenPos.project(activeCamera);

      // Convert to screen coordinates
      const x = (bodyScreenPos.x * 0.5 + 0.5) * container.clientWidth;
      const y = (-bodyScreenPos.y * 0.5 + 0.5) * container.clientHeight;

      // Position label slightly offset from the screen position
      label.style.left = `${x + 20}px`;
      label.style.top = `${y}px`;
    }

    // Update label text
    label.textContent = `Force: (${force.x.toFixed(1)}, ${force.y.toFixed(1)}, ${force.z.toFixed(1)})`;
  }

  // Function to clean up resources
  function cleanup() {
    scene.remove(arrowHelper);
    if (label.parentNode) {
      label.parentNode.removeChild(label);
    }
  }

  return {
    update,
    cleanup
  };
} 