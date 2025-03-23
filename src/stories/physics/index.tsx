import * as CANNON from "cannon-es";
import { StoryOptions } from "../types";

// Import our modular components
import { createBasicPhysicsObjects, updateVisuals } from "./core";
import { createForceVisualization } from "./force-visualization";
import { setupPhysicsControls, storeInitialPositions } from "./gui";
import { createPhysicsWorld } from "./helpers";
import { setupKeyboardControls } from "./keyboard";
import { createRopes } from "./rope";

// Store UI elements and animation ID for cleanup
let keyboardControls: ReturnType<typeof setupKeyboardControls> | null = null;
let animationFrameId: number | null = null;
let forceVisualizer: ReturnType<typeof createForceVisualization> | null = null;

// Store the horizontal force vector
const horizontalForce = new CANNON.Vec3(0, 0, 0);

const PhysicsChain = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, gui, controls } = options;
    gui.show();

    // Create physics world
    const world = createPhysicsWorld();

    // Create basic physics objects (platform and sphere)
    const { physicsObjects, platformBody, sphereBody } = createBasicPhysicsObjects(scene, world);

    // Setup physics controls
    const { controls: pushForceControl } =
      setupPhysicsControls(gui, physicsObjects, sphereBody);

    // Setup force visualizer
    forceVisualizer = createForceVisualization(
      scene,
      platformBody,
      renderer.domElement.parentElement || document.body,
      camera
    );

    // Define attachment points for ropes - cast shape to Box type to access halfExtents
    const platformShape = platformBody.shapes[0] as CANNON.Box;
    const attachmentPoints = [
      { x: -platformShape.halfExtents.x, z: -platformShape.halfExtents.z },
      { x: platformShape.halfExtents.x, z: -platformShape.halfExtents.z },
      { x: -platformShape.halfExtents.x, z: platformShape.halfExtents.z },
      { x: platformShape.halfExtents.x, z: platformShape.halfExtents.z }
    ];

    // Create ropes connecting platform and sphere
    const ropes = createRopes(
      world,
      scene,
      platformBody,
      sphereBody,
      attachmentPoints,
      {
        numSegments: 20,
        thickness: 0.25,
        colors: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00]
      }
    );

    // Add rope segments and constraints to physicsObjects
    ropes.forEach(rope => {
      physicsObjects.addObjects!(
        rope.segments,
        rope.constraints,
        rope.visualMeshes,
        rope.constraintLines
      );
    });

    // Store initial positions for reset functionality
    storeInitialPositions(physicsObjects);

    // Setup keyboard controls
    keyboardControls = setupKeyboardControls(platformBody, {
      resetSceneCallback: pushForceControl.resetScene,
      platformForce: pushForceControl.platformForce
    });

    function applyForces() {
      // Apply lift force to platform body
      platformBody.applyForce(
        new CANNON.Vec3(0, 20 * sphereBody.mass, 0),
        new CANNON.Vec3(0, 0, 0)
      );

      // Apply gravity to sphere body
      sphereBody.applyForce(
        new CANNON.Vec3(0, -9.82 * sphereBody.mass, 0),
        new CANNON.Vec3(0, 0, 0)
      );

      // Apply horizontal force to platform body
      // Convert direction from degrees to radians and create the horizontal force
      const direction = pushForceControl.horizontalForceDirection * (Math.PI / 180);
      const magnitude = pushForceControl.horizontalForce;

      horizontalForce.set(
        -Math.sin(direction) * magnitude, // X component (using negative sine for correct direction)
        0,                               // No vertical component
        -Math.cos(direction) * magnitude  // Z component (using negative cosine for correct direction)
      );

      // Apply the horizontal force to the platform
      if (magnitude > 0) {
        platformBody.applyForce(horizontalForce, new CANNON.Vec3(0, 0, 0));

        // Update the force visualizer
        if (forceVisualizer) {
          forceVisualizer.update(horizontalForce, camera);
        }
      } else if (forceVisualizer) {
        // Hide the visualizer if no force is applied
        forceVisualizer.update(new CANNON.Vec3(0, 0, 0), camera);
      }
    }

    // Physics update function (internal function)
    function updatePhysics() {
      // Step the physics world
      world.step(1 / 60);

      // Apply forces from keyboard input
      if (keyboardControls) {
        keyboardControls.applyInputForces();
      }

      applyForces();

      // Auto-rotate the camera if enabled
      if (pushForceControl.isAutoRotate) {
        const rotationSpeed = pushForceControl.autoRotateSpeed;
        const radius = 30;
        const angle = Date.now() * 0.0005 * rotationSpeed;

        camera.position.x = Math.cos(angle) * radius;
        camera.position.z = Math.sin(angle) * radius;
        camera.lookAt(0, 0, 0);
      }

      // Update the controls
      controls.update();

      // Update visual representations to match physics bodies
      updateVisuals(physicsObjects);
    }

    // Animation loop
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      updatePhysics();
      renderer.render(scene, camera);
      camera.lookAt(platformBody.position as any);
    }

    // Start the animation loop
    animate();
  },

  unload: async () => {
    // Stop animation loop
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    // Clean up keyboard controls
    if (keyboardControls) {
      keyboardControls.cleanup();
      keyboardControls = null;
    }

    // Clean up force visualizer
    if (forceVisualizer) {
      forceVisualizer.cleanup();
      forceVisualizer = null;
    }
  }
};

export default PhysicsChain; 