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

    function applyForcesAndDrawVectors() {
      // Get the glider's velocity and normalize it for direction calculations
      const glideDirection = gliderBody.velocity.clone();
      const speed = glideDirection.length();

      if (speed > 0.001) {
        glideDirection.normalize();
      }

      // Calculate the relative wind direction (opposite to glide direction)
      const dragVector = glideDirection.negate();

      // Define lift distribution points along the glider's surface
      const liftPoints = [
        // Left wing points (from center to tip)
        { x: -4, z: 0, weight: 0.2 },
        { x: -8, z: 0, weight: 0.15 },
        { x: -12, z: 0, weight: 0.1 },
        // Center points
        { x: 0, z: -2, weight: 0.1 },
        { x: 0, z: 0, weight: 0.1 },
        { x: 0, z: 2, weight: 0.1 },
        // Right wing points (from center to tip)
        { x: 4, z: 0, weight: 0.2 },
        { x: 8, z: 0, weight: 0.15 },
        { x: 12, z: 0, weight: 0.1 }
      ];

      // Base lift magnitude calculation
      const baseLiftMagnitude = 9.82 * pilotBody.mass;

      // Apply distributed lift forces
      liftPoints.forEach((point, index) => {
        // Create local lift vector in glider's local space
        const localLiftVector = new CANNON.Vec3(0, baseLiftMagnitude * point.weight, 0);

        // Create application point in glider's local space
        const localPoint = new CANNON.Vec3(point.x, 0, point.z);

        // Transform vectors to world space
        const worldLiftVector = new CANNON.Vec3();
        const worldPoint = new CANNON.Vec3();
        gliderBody.vectorToWorldFrame(localLiftVector, worldLiftVector);
        gliderBody.vectorToWorldFrame(localPoint, worldPoint);

        // Apply the lift force at this point
        gliderBody.applyForce(worldLiftVector, worldPoint);

        // Visualize each lift force point
        if (vectorVisualizer) {
          vectorVisualizer.addForce({
            name: `LIFT_${index}`,
            color: 0x00ff00, // Green
            position: new THREE.Vector3(worldPoint.x, worldPoint.y, worldPoint.z),
            vector: worldLiftVector,
            scale: 0.01 * 0.2,
          });
        }
      });

      // Apply weight force (gravity) to the pilot
      const weightVector = new CANNON.Vec3(0, -9.82 * pilotBody.mass, 0);
      pilotBody.applyForce(weightVector);

      // Apply drag force distributed across the glider
      const dragPoints = [
        { x: 0, z: -6 },  // Front
        { x: 0, z: 6 },   // Back
        { x: -6, z: 0 },  // Left
        { x: 6, z: 0 }    // Right
      ];

      const baseDragMagnitude = 5 * pilotBody.mass * (speed * speed * 0.01); // Quadratic drag

      dragPoints.forEach((point, index) => {
        const localDragVector = dragVector.scale(baseDragMagnitude * 0.25); // Distribute drag force
        const localPoint = new CANNON.Vec3(point.x, 0, point.z);

        const worldDragVector = new CANNON.Vec3();
        const worldPoint = new CANNON.Vec3();
        gliderBody.vectorToWorldFrame(localDragVector, worldDragVector);
        gliderBody.vectorToWorldFrame(localPoint, worldPoint);

        gliderBody.applyForce(worldDragVector, worldPoint);

        if (vectorVisualizer) {
          vectorVisualizer.addForce({
            name: `DRAG_${index}`,
            color: 0xff0000, // Red
            position: new THREE.Vector3(worldPoint.x, worldPoint.y, worldPoint.z),
            vector: worldDragVector,
            scale: 0.01 * 0.2,
          });
        }
      });

      // Calculate and apply break forces
      const breakMagnitude = pushForceControl.leftBreakForce * pilotBody.mass;

      if (pushForceControl.leftBreakForce > 0) {
        const leftBreakPoints = [
          { x: -8, z: 0, weight: 0.5 },
          { x: -12, z: 0, weight: 0.5 }
        ];

        leftBreakPoints.forEach((point, index) => {
          const localBreakVector = new CANNON.Vec3(-breakMagnitude * point.weight, 0, 0);
          const localPoint = new CANNON.Vec3(point.x, 0, point.z);

          const worldBreakVector = new CANNON.Vec3();
          const worldPoint = new CANNON.Vec3();
          gliderBody.vectorToWorldFrame(localBreakVector, worldBreakVector);
          gliderBody.vectorToWorldFrame(localPoint, worldPoint);

          gliderBody.applyForce(worldBreakVector, worldPoint);

          vectorVisualizer.addForce({
            name: `L_BREAK_${index}`,
            color: 0xff00ff, // Magenta
            position: new THREE.Vector3(worldPoint.x, worldPoint.y, worldPoint.z),
            vector: worldBreakVector,
            scale: 0.01 * 0.2,
          });
        });
      }

      if (pushForceControl.rightBreakForce > 0) {
        const rightBreakPoints = [
          { x: 8, z: 0, weight: 0.5 },
          { x: 12, z: 0, weight: 0.5 }
        ];

        rightBreakPoints.forEach((point, index) => {
          const localBreakVector = new CANNON.Vec3(breakMagnitude * point.weight, 0, 0);
          const localPoint = new CANNON.Vec3(point.x, 0, point.z);

          const worldBreakVector = new CANNON.Vec3();
          const worldPoint = new CANNON.Vec3();
          gliderBody.vectorToWorldFrame(localBreakVector, worldBreakVector);
          gliderBody.vectorToWorldFrame(localPoint, worldPoint);

          gliderBody.applyForce(worldBreakVector, worldPoint);

          vectorVisualizer.addForce({
            name: `R_BREAK_${index}`,
            color: 0x00ffff, // Cyan
            position: new THREE.Vector3(worldPoint.x, worldPoint.y, worldPoint.z),
            vector: worldBreakVector,
            scale: 0.01 * 0.2,
          });
        });
      }

      // Visualize weight force
      if (!weightVector.isZero()) {
        vectorVisualizer.addForce({
          name: "WEIGHT",
          color: 0xffff00, // Yellow
          position: pilotBody.position as any,
          vector: weightVector,
          scale: 0.01 * 0.2,
        });
      }

      // Visualize glide direction
      if (!glideDirection.isZero()) {
        vectorVisualizer.addForce({
          name: "GLIDE",
          color: 0x0000ff, // Blue
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
        camera.position.y = gliderBody.position.y - 2;
      }

      // Update the orbit controls target to follow the glider
      controls.target.copy(gliderBody.position as any);
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