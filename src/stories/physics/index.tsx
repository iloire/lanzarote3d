import * as CANNON from "cannon-es";
import * as THREE from "three";
import { StoryOptions } from "../types";

// Import our modular components
import { FlightHUD } from "../../components/flight-hud";
import { VectorVisualizater } from "../../utils/vector-visualizer";
import { createBasicPhysicsObjects, updateVisuals } from "./core";
import { setupPhysicsControls, storeInitialPositions } from "./gui";
import { createPhysicsWorld } from "./helpers";
import { setupKeyboardControls } from "./keyboard";
import { createLines } from "./lines";

// Store UI elements and animation ID for cleanup
let keyboardControls: ReturnType<typeof setupKeyboardControls> | null = null;
let vectorVisualizer: VectorVisualizater | null = null;
let hud: FlightHUD | null = null;

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

    // Initialize the HUD
    hud = new FlightHUD({ scene, camera });

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

    // Create lines connecting platform and sphere
    const lines = createLines(
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

    // Add line segments and constraints to physicsObjects
    lines.forEach(line => {
      physicsObjects.addObjects!(
        line.segments,
        line.constraints,
        line.visualMeshes,
        line.constraintLines
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


      const liftMagnitude = 14.82 * pilotBody.mass;
      const liftVector = new CANNON.Vec3(0, liftMagnitude, 0);
      gliderBody.applyForce(
        liftVector
      );

      // Apply weight force (gravity) to the pilot
      const weightVector = new CANNON.Vec3(0, -9.82 * pilotBody.mass, 0);
      pilotBody.applyForce(
        weightVector,
      );

      // // Set drag force
      // dragVector.set(0, 0, -5 * pilotBody.mass);
      // pilotBody.applyForce(
      //   dragVector,
      //   gliderBody.position
      // );

      // Calculate break forces using GUI control values
      // Left break force - pulls down and to the left
      const breakMagnitude = pushForceControl.leftBreakForce * pilotBody.mass;
      const leftBreakVector = new CANNON.Vec3(
        -breakMagnitude,
        0,
        0
      );
      gliderBody.vectorToWorldFrame(leftBreakVector, leftBreakVector);

      // Right break force - pulls down and to the right
      const rightBreakVector = new CANNON.Vec3(
        -breakMagnitude,
        0,
        0
      );
      gliderBody.vectorToWorldFrame(rightBreakVector, rightBreakVector);

      // Apply break forces if they are active (value > 0)
      if (pushForceControl.leftBreakForce > 0) {
        const leftWingTip = new CANNON.Vec3(-5, 0, 0);
        gliderBody.vectorToWorldFrame(leftWingTip, leftWingTip);
        gliderBody.applyForce(
          leftBreakVector,
          leftWingTip
        );
      }

      if (pushForceControl.rightBreakForce > 0) {
        const rightWingTip = new CANNON.Vec3(5, 0, 0);
        gliderBody.vectorToWorldFrame(rightWingTip, rightWingTip);
        gliderBody.applyForce(
          rightBreakVector,
          rightWingTip
        );
      }

      // Update vector visualization
      vectorVisualizer.update(
        new THREE.Vector3().copy(gliderBody.position as any),  // Wing position
        new THREE.Vector3().copy(pilotBody.position as any),    // Pilot position
        liftVector,                                               // Lift force
        dragVector,                                               // Drag force
        weightVector,                                             // Weight force
        glideDirection,                                           // Glide direction
        pushForceControl.leftBreakForce > 0 ? leftBreakVector : null,  // Left break force if active
        pushForceControl.rightBreakForce > 0 ? rightBreakVector : null  // Right break force if active
      );
    }

    // Physics update function (internal function)
    function updatePhysics() {
      // Step the physics world
      world.step(1 / 60);

      // Apply forces from keyboard input
      keyboardControls.applyInputForces(vectorVisualizer);

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

      // Update HUD with current flight data
      if (hud) {
        hud.update(
          new THREE.Vector3(
            gliderBody.velocity.x,
            gliderBody.velocity.y,
            gliderBody.velocity.z
          ),
          new THREE.Vector3(
            gliderBody.position.x,
            gliderBody.position.y,
            gliderBody.position.z
          ),
          new THREE.Euler().setFromQuaternion(
            new THREE.Quaternion(
              gliderBody.quaternion.x,
              gliderBody.quaternion.y,
              gliderBody.quaternion.z,
              gliderBody.quaternion.w
            )
          )
        );
        hud.render(renderer);
      } else {
        renderer.render(scene, camera);
      }
    }

    // Start the animation loop
    animate();

    // Set camera position to be above the platform
    camera.position.y = gliderBody.position.y + 20;
    camera.position.x = 100;
    camera.position.z = 100;
    camera.lookAt(gliderBody.position as any);

    // Return cleanup function
    return () => {
      if (keyboardControls) {
        keyboardControls.cleanup();
        keyboardControls = null;
      }
      if (hud) {
        hud.dispose();
        hud = null;
      }
    };
  },
};

export default PhysicsChain; 