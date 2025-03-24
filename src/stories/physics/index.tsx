import * as CANNON from "cannon-es";
import * as THREE from "three";
import { StoryOptions } from "../types";

// Import our modular components
import { VectorVisualizater } from "../../utils/vector-visualizer";
import { createBasicPhysicsObjects, updateVisuals } from "./core";
import { setupPhysicsControls, storeInitialPositions } from "./gui";
import { createPhysicsWorld } from "./helpers";
import { setupKeyboardControls } from "./keyboard";
import { createRopes } from "./rope";

// Store UI elements and animation ID for cleanup
let keyboardControls: ReturnType<typeof setupKeyboardControls> | null = null;
let vectorVisualizer: VectorVisualizater | null = null;

const PhysicsChain = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, gui, controls } = options;
    gui.show();

    // Create physics world
    const world = createPhysicsWorld();

    // Create basic physics objects (platform and sphere)
    const { physicsObjects, gliderBody: gliderBody, pilotBody: pilotBody } = createBasicPhysicsObjects(scene, world);

    // Setup vector visualizer
    vectorVisualizer = new VectorVisualizater(scene);
    // Set custom scale to make vectors more visible
    vectorVisualizer.setScale(3.0);

    // Setup physics controls
    const { controls: pushForceControl } =
      setupPhysicsControls(gui, physicsObjects, pilotBody, vectorVisualizer);

    // Define attachment points for ropes - cast shape to Box type to access halfExtents
    const platformShape = gliderBody.shapes[0] as CANNON.Box;
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
      gliderBody,
      pilotBody,
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
    keyboardControls = setupKeyboardControls(gliderBody, {
      resetSceneCallback: pushForceControl.resetScene,
    });

    function applyForcesAndDrawVectors() {
      // the glide direction is in the directio of the speed of the glider  
      const glideDirection = gliderBody.velocity.clone();

      // drag vector is in the opposite direction of the glide direction
      const dragVector = glideDirection.negate();

      // Calculate forces to be applied
      const weightVector = new CANNON.Vec3(0, -9.82 * pilotBody.mass, 0);

      // Calculate lift magnitude based on angle of attack
      // Maximum lift at 15 degrees (0.26 radians), reduces at higher angles
      // Base lift force proportional to pilot mass
      const ANGLE_OF_ATTACK = 0.26;
      const liftMagnitude = 11.82 * pilotBody.mass;
      const liftVector = new CANNON.Vec3(liftMagnitude * Math.sin(ANGLE_OF_ATTACK),
        liftMagnitude * Math.cos(ANGLE_OF_ATTACK), liftMagnitude * Math.sin(ANGLE_OF_ATTACK));
      gliderBody.applyForce(
        liftVector,
        new CANNON.Vec3(0, 0, 0)
      );

      // Apply weight force (gravity) to the pilot
      pilotBody.applyForce(
        weightVector,
        new CANNON.Vec3(0, 0, 0)
      );

      // Set drag force
      dragVector.set(0, 0, -5 * pilotBody.mass);
      pilotBody.applyForce(
        dragVector,
        new CANNON.Vec3(0, 0, 0)
      );

      // Update vector visualization
      if (vectorVisualizer) {
        vectorVisualizer.update(
          new THREE.Vector3().copy(gliderBody.position as any),  // Wing position
          new THREE.Vector3().copy(pilotBody.position as any),    // Pilot position
          liftVector,                                               // Lift force
          dragVector,                                               // Drag force
          weightVector,                                             // Weight force
          glideDirection                                           // Glide direction
        );
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

      applyForcesAndDrawVectors();


      // Auto-rotate the camera if enabled
      if (pushForceControl.isAutoRotate) {
        const rotationSpeed = pushForceControl.autoRotateSpeed;
        const radius = 30;
        const angle = Date.now() * 0.0005 * rotationSpeed;

        camera.position.x = Math.cos(angle) * radius;
        camera.position.z = Math.sin(angle) * radius;
        camera.position.y = gliderBody.position.y + 20;
        camera.lookAt(gliderBody.position as any);
        controls.update();
      }

      // Update the controls
      controls.update();

      // Update visual representations to match physics bodies
      updateVisuals(physicsObjects);
    }

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      updatePhysics();
      renderer.render(scene, camera);
    }

    // Start the animation loop
    animate();

    // Set camera position to be above the platform
    camera.position.y = gliderBody.position.y + 20;
    camera.position.x = 100;
    camera.position.z = 100;
    camera.lookAt(gliderBody.position as any);
  },
};

export default PhysicsChain; 