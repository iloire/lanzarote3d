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

    const initialPosition = new THREE.Vector3(100, 190, 0);

    // Create basic physics objects (platform and sphere)
    const {
      physicsObjects,
      gliderBody: gliderBody,
      pilotBody: pilotBody
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

      // for now let's keep it same as weight
      const liftMagnitude = 8.82 * pilotBody.mass;
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

      // apply forward force in the direction of the glider
      const forwardForce = gliderBody.velocity.negate().scale(1);
      gliderBody.applyForce(
        forwardForce,
        gliderBody.position
      );

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

      if (forwardForce.isZero()) {
        vectorVisualizer.removeForce("FORWARD");
      } else {
        vectorVisualizer.addForce({
          name: "FORWARD",
          color: 0x0000ff, // Blue
          position: gliderBody.position as any,
          vector: forwardForce,
        });
      }

      // instead of using the vector visualizer update method, we can manually add and remove forces
      // this is useful for debugging
      if (liftVector.isZero()) {
        vectorVisualizer.removeForce("LIFT");
      } else {
        vectorVisualizer.addForce({
          name: "LIFT",
          color: 0xff00ff, // Magenta 
          position: gliderBody.position as any,
          vector: liftVector,
          scale: 0.01 * 0.2,
        });
      }

      if (weightVector.isZero()) {
        vectorVisualizer.removeForce("WEIGHT");
      } else {
        vectorVisualizer.addForce({
          name: "WEIGHT",
          color: 0xff00ff, // Magenta 
          position: pilotBody.position as any,
          vector: weightVector,
          scale: 0.01 * 0.2,
        });
      }

      if (dragVector.isZero()) {
        vectorVisualizer.removeForce("DRAG");
      } else {
        vectorVisualizer.addForce({
          name: "DRAG",
          color: 0xff00ff, // Magenta   
          position: gliderBody.position as any,
          vector: dragVector,
          scale: 0.01 * 0.2,
        });
      }

      if (glideDirection.isZero()) {
        vectorVisualizer.removeForce("GLIDE");
      } else {
        vectorVisualizer.addForce({
          name: "GLIDE",
          color: 0xff00ff, // Magenta   
          position: gliderBody.position as any,
          vector: glideDirection,
          scale: 0.01 * 0.2,
        });
      }
    }

    // Physics update function (internal function)
    function updatePhysics() {
      // Step the physics world
      world.step(1 / 60);

      // Apply forces from keyboard input
      keyboardControls.applyInputForces(vectorVisualizer);

      applyForcesAndDrawVectors();

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
          gliderBody.position.x + 50,
          gliderBody.position.y + 50,
          gliderBody.position.z + 50
        );
      }

      // Always look at the glider
      camera.lookAt(new THREE.Vector3(
        gliderBody.position.x,
        gliderBody.position.y,
        gliderBody.position.z
      ));
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