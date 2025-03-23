import * as CANNON from "cannon-es";

// Import our modular components
import { StoryOptions } from "../types";
import { createBasicPhysicsObjects, updateVisuals } from "./core";
import { findControllerByProperty, setupPhysicsControls, storeInitialPositions } from "./gui";
import { arrayIncludes, createPhysicsWorld, KEY_MAPPING } from "./helpers";
import { createRopes } from "./rope";
import { createAntiGravityButton, createPlatformButtons, createSphereButtons } from "./ui";



const PhysicsChain = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, gui, controls } = options;

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
      { x: -platformShape.halfExtents.x / 2, z: -platformShape.halfExtents.z / 2 },
      { x: platformShape.halfExtents.x / 2, z: -platformShape.halfExtents.z / 2 },
      { x: -platformShape.halfExtents.x / 2, z: platformShape.halfExtents.z / 2 },
      { x: platformShape.halfExtents.x / 2, z: platformShape.halfExtents.z / 2 }
    ];

    // Create ropes connecting platform and sphere
    const ropes = createRopes(
      world,
      scene,
      platformBody,
      sphereBody,
      attachmentPoints,
      {
        numSegments: 8,
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
    const platformButtons = createPlatformButtons(
      renderer.domElement.parentElement || document.body,
      platformBody,
      pushForceControl.platformForce
    );

    // Listen for changes to button visibility
    findControllerByProperty(physicsFolder, 'showButtons')?.onChange((value: boolean) => {
      platformButtons.leftButton.parentElement!.style.display = value ? 'flex' : 'none';
    });

    // Create UI buttons for sphere control
    const sphereButtons = createSphereButtons(
      renderer.domElement.parentElement || document.body,
      sphereBody,
      pushForceControl.pushForce
    );

    // Listen for changes to sphere button visibility
    findControllerByProperty(physicsFolder, 'showSphereButtons')?.onChange((value: boolean) => {
      sphereButtons.buttonContainer.style.display = value ? 'grid' : 'none';
    });

    // Create the anti-gravity button
    const antiGravityButton = createAntiGravityButton(
      renderer.domElement.parentElement || document.body,
      physicsObjects,
      pushForceControl.antiGravityForce
    );

    // Initialize the visibility based on the setting
    antiGravityButton.buttonContainer.style.display =
      pushForceControl.showAntiGravityButton ? 'block' : 'none';

    // Add listener for visibility toggle
    findControllerByProperty(physicsFolder, 'showAntiGravityButton')?.onChange((value: boolean) => {
      antiGravityButton.buttonContainer.style.display = value ? 'block' : 'none';
    });

    // Event listeners for keyboard controls
    function onKeyDown(event: KeyboardEvent) {
      keysPressed.add(event.code);

      // Reset positions
      if (arrayIncludes(KEY_MAPPING.RESET_POSITION, event.code)) {
        pushForceControl.resetScene();
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      keysPressed.delete(event.code);
    }

    // Add event listeners
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

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

    // Physics simulation and visualization loop
    const fps = 160; // Higher FPS for smoother physics
    const animate = () => {
      setTimeout(() => {
        requestAnimationFrame(animate);
      }, 1000 / fps);

      // Step the physics world
      world.step(1 / 60);

      // Apply forces from keyboard input
      applyInputForces();

      // Apply forces from UI buttons
      platformButtons.applyButtonForces();
      sphereButtons.applyButtonForces();
      antiGravityButton.applyButtonForces();

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

      // Render the scene
      renderer.render(scene, camera);
    };

    // Start the animation loop
    animate();

    // Cleanup function to remove event listeners when scene changes
    return () => {
      platformButtons.cleanup();
      sphereButtons.cleanup();
      antiGravityButton.cleanup();

      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);

      // Remove the renderer and GUI
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }

      gui.destroy();
    };
  }
};

export default PhysicsChain; 