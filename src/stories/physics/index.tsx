import * as CANNON from "cannon-es";
import { StoryOptions } from "../types";

// Import our modular components
import { createBasicPhysicsObjects, updateVisuals } from "./core";
import { findControllerByProperty, setupPhysicsControls, storeInitialPositions } from "./gui";
import { arrayIncludes, createPhysicsWorld, KEY_MAPPING } from "./helpers";
import { createRopes } from "./rope";
import { createPlatformButtons } from "./ui";

// Store listeners and UI elements for cleanup
let keyDownListener: ((event: KeyboardEvent) => void) | null = null;
let keyUpListener: ((event: KeyboardEvent) => void) | null = null;
let platformButtonsRef: ReturnType<typeof createPlatformButtons> | null = null;
let animationFrameId: number | null = null;

const PhysicsChain = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, gui, controls } = options;
    gui.show();

    // Create physics world
    const world = createPhysicsWorld();

    // Create basic physics objects (platform and sphere)
    const { physicsObjects, platformBody, sphereBody } = createBasicPhysicsObjects(scene, world);

    // Setup physics controls
    const { folder: physicsFolder, controls: pushForceControl } =
      setupPhysicsControls(gui, physicsObjects, sphereBody);

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
        thickness: 0.15,
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

    // Set to keep track of pressed keys
    const keysPressed = new Set<string>();

    // Create UI buttons for platform control
    platformButtonsRef = createPlatformButtons(
      renderer.domElement.parentElement || document.body,
      platformBody,
      pushForceControl.platformForce
    );

    // Listen for changes to button visibility
    findControllerByProperty(physicsFolder, 'showButtons')?.onChange((value: boolean) => {
      if (platformButtonsRef?.leftButton?.parentElement) {
        platformButtonsRef.leftButton.parentElement.style.display = value ? 'flex' : 'none';
      }
    });


    // Event listeners for keyboard controls
    keyDownListener = (event: KeyboardEvent) => {
      keysPressed.add(event.code);

      // Reset positions
      if (arrayIncludes(KEY_MAPPING.RESET_POSITION, event.code)) {
        pushForceControl.resetScene();
      }
    };

    keyUpListener = (event: KeyboardEvent) => {
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
            new CANNON.Vec3(-pushForceControl.platformForce, 0, 0),
            new CANNON.Vec3(0, 0, 0)
          );
        }

        if (keysPressed.has(KEY_MAPPING.PLATFORM_RIGHT[0])) {
          platformBody.applyForce(
            new CANNON.Vec3(pushForceControl.platformForce, 0, 0),
            new CANNON.Vec3(0, 0, 0)
          );
        }
      }
    }

    function applyForces() {
      // apply lift force to platform body
      platformBody.applyForce(
        new CANNON.Vec3(0, 9.92 * sphereBody.mass, 0),
        new CANNON.Vec3(0, 0, 0)
      );

      // apply gravity to sphere body
      sphereBody.applyForce(
        new CANNON.Vec3(0, -9.82 * sphereBody.mass, 0),
        new CANNON.Vec3(0, 0, 0)
      );
    }

    // Physics update function (internal function)
    function updatePhysics() {
      // Step the physics world
      world.step(1 / 60);

      // Apply forces from keyboard input
      applyInputForces();

      applyForces();

      // Apply forces from UI buttons
      if (platformButtonsRef) platformButtonsRef.applyButtonForces();

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
      controls.update();
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

    // Clean up event listeners
    if (keyDownListener) window.removeEventListener('keydown', keyDownListener);
    if (keyUpListener) window.removeEventListener('keyup', keyUpListener);

    // Clean up UI controls
    if (platformButtonsRef) platformButtonsRef.cleanup();

    // Reset references
    keyDownListener = null;
    keyUpListener = null;
    platformButtonsRef = null;
  }
};

export default PhysicsChain; 