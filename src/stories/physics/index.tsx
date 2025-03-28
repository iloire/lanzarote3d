import * as CANNON from "cannon-es";
import * as THREE from "three";
import { StoryOptions } from "../types";

// Import our modular components
import { FlightHUD } from "../../components/flight-hud";
import { VectorVisualizater } from "../../utils/vector-visualizer";
import { createBasicPhysicsObjects, updateVisuals } from "./core";
import { applyForcesAndDrawVectors } from "./force-application";
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

    const initialPosition = new THREE.Vector3(100, 190, 0);

    // Create basic physics objects (platform and sphere)
    const {
      physicsObjects,
      gliderBody,
      pilotBody
    } = createBasicPhysicsObjects(scene, world, initialPosition);

    // Setup vector visualizer
    vectorVisualizer = new VectorVisualizater(scene);
    // Set custom scale to make vectors more visible
    vectorVisualizer.setScale(13.0);

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
        numSegments: 40,
        thickness: 0.05,
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

    // Physics update function (internal function)
    function updatePhysics() {
      // Step the physics world
      world.step(1 / 60);

      // Apply forces from keyboard input
      keyboardControls.applyInputForces(vectorVisualizer);

      // Apply all physics forces and visualize them
      applyForcesAndDrawVectors({
        gliderBody,
        pilotBody,
        vectorVisualizer,
        leftBreakForce: pushForceControl.leftBreakForce,
        rightBreakForce: pushForceControl.rightBreakForce
      });

      // Update visual representations to match physics bodies
      updateVisuals(physicsObjects);
    }

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      updatePhysics();

      // Auto-rotate the camera if enabled
      if (pushForceControl.isAutoRotate) {
        const rotationSpeed = pushForceControl.autoRotateSpeed;
        const radius = 30;
        const angle = Date.now() * 0.0005 * rotationSpeed;

        camera.position.x = gliderBody.position.x + Math.cos(angle) * radius;
        camera.position.z = gliderBody.position.z + Math.sin(angle) * radius;
        camera.position.y = gliderBody.position.y + 20;
      } else {
        // Always follow the glider, but from a fixed position when not auto-rotating
        camera.position.set(
          gliderBody.position.x + 30,
          gliderBody.position.y + 20,
          gliderBody.position.z + 30
        );
      }

      // Update the orbit controls target to follow the glider
      controls.target.set(
        gliderBody.position.x,
        gliderBody.position.y,
        gliderBody.position.z
      );
      controls.update();

      // First render the scene
      renderer.render(scene, camera);

      // Then update and render the HUD on top
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
      }
    }

    // Start the animation loop
    animate();
  },
};

export default PhysicsChain; 