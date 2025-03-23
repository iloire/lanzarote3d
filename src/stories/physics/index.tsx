import * as CANNON from "cannon-es";
import { StoryOptions } from "../types";

// Import our modular components
import { createBasicPhysicsObjects, updateVisuals } from "./core";
import { setupPhysicsControls, storeInitialPositions } from "./gui";
import { createPhysicsWorld } from "./helpers";
import { setupKeyboardControls } from "./keyboard";
import { createRopes } from "./rope";

// Store UI elements and animation ID for cleanup
let keyboardControls: ReturnType<typeof setupKeyboardControls> | null = null;
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
    const { controls: pushForceControl } =
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
      // apply lift force to platform body
      platformBody.applyForce(
        new CANNON.Vec3(0, 20 * sphereBody.mass, 0),
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
  }
};

export default PhysicsChain; 