import * as CANNON from "cannon-es";
import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import Helpers from "../utils/helpers";
import { StoryOptions } from "./types";

// Constants for force application
const PUSH_FORCE_MAGNITUDE = 300; // Strength of push when keys are pressed
const KEY_MAPPING = {
  PUSH_UP: ['KeyW', 'ArrowUp'],      // W or Up Arrow: Push forward
  PUSH_DOWN: ['KeyS', 'ArrowDown'],  // S or Down Arrow: Push backward
  PUSH_LEFT: ['KeyA', 'ArrowLeft'],  // A or Left Arrow: Push left
  PUSH_RIGHT: ['KeyD', 'ArrowRight'],// D or Right Arrow: Push right
  PUSH_UP_VERT: ['KeyR'],            // R: Push upward (altitude)
  PUSH_DOWN_VERT: ['KeyF'],          // F: Push downward
  RESET_POSITION: ['KeyX'],          // X: Reset positions
  CREATE_PENDULUM: ['KeyP'],         // P: Create a pendulum
  CREATE_CHAIN: ['KeyC'],            // C: Create a chain
};

// Helper function to check if an array contains a value (compatible with older JS)
function arrayIncludes(array: string[], value: string): boolean {
  return array.indexOf(value) !== -1;
}

// Function to create a static box visualization at a specific position
function createBoxVisualization(
  scene: THREE.Scene,
  dimensions: CANNON.Vec3,
  position: THREE.Vector3,
  color: number = 0xffff00,
  label?: string
): THREE.Mesh {
  // Create a Three.js box with the same dimensions as the CANNON.Box
  // CANNON.Box dimensions are half-extents, so we double them for Three.js
  const width = dimensions.x * 2;
  const height = dimensions.y * 2;
  const depth = dimensions.z * 2;

  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    transparent: true,
    opacity: 0.7
  });

  const boxMesh = new THREE.Mesh(geometry, material);
  boxMesh.position.copy(position);
  scene.add(boxMesh);

  // Add label if provided
  if (label) {
    // Create a label with an offset above the box
    const labelOffset = new THREE.Vector3(0, height * 0.6, 0);
    const size = Math.max(width, height, depth) * 0.25;
    Helpers.createLabel(scene, label, position, color, size, labelOffset);
  }

  return boxMesh;
}

// Function to create a sphere visualization
function createSphereVisualization(
  scene: THREE.Scene,
  radius: number,
  position: THREE.Vector3,
  color: number = 0xffff00,
  label?: string
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: true,
    transparent: true,
    opacity: 0.7
  });

  const sphereMesh = new THREE.Mesh(geometry, material);
  sphereMesh.position.copy(position);
  scene.add(sphereMesh);

  // Add label if provided
  if (label) {
    // Create a label with an offset above the sphere
    const labelOffset = new THREE.Vector3(0, radius * 1.5, 0);
    const size = radius;
    Helpers.createLabel(scene, label, position, color, size, labelOffset);
  }

  return sphereMesh;
}

// Function to create a line visualization between two points
function createLineVisualization(
  scene: THREE.Scene,
  startPoint: THREE.Vector3,
  endPoint: THREE.Vector3,
  color: number = 0xffffff
): THREE.Line {
  const points = [
    startPoint.clone(),
    endPoint.clone()
  ];

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: color,
    linewidth: 2
  });

  const line = new THREE.Line(geometry, material);
  scene.add(line);

  // Helper function to update the line positions
  line.userData.updatePositions = (start: THREE.Vector3, end: THREE.Vector3) => {
    const positions = new Float32Array([
      start.x, start.y, start.z,
      end.x, end.y, end.z
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.attributes.position.needsUpdate = true;
  };

  return line;
}

// Function to create a chain of bodies connected by constraints
function createPhysicsChain(
  world: CANNON.World,
  scene: THREE.Scene,
  startPosition: THREE.Vector3,
  numElements: number = 5,
  elementSpacing: number = 2,
  fixedPoint: boolean = true
): {
  bodies: CANNON.Body[],
  constraints: CANNON.PointToPointConstraint[],
  visualMeshes: THREE.Mesh[],
  constraintLines: THREE.Line[]
} {
  const bodies: CANNON.Body[] = [];
  const constraints: CANNON.PointToPointConstraint[] = [];
  const visualMeshes: THREE.Mesh[] = [];
  const constraintLines: THREE.Line[] = [];

  const boxSize = 1;
  const boxMass = 1;
  const boxShape = new CANNON.Box(new CANNON.Vec3(boxSize, boxSize, boxSize));

  // Create a fixed anchor point if requested
  if (fixedPoint) {
    const anchorBody = new CANNON.Body({
      mass: 0, // Zero mass = static body
      position: new CANNON.Vec3(startPosition.x, startPosition.y, startPosition.z),
      shape: boxShape
    });
    world.addBody(anchorBody);
    bodies.push(anchorBody);

    // Create visualization for the anchor
    const anchorMesh = createBoxVisualization(
      scene,
      new CANNON.Vec3(boxSize, boxSize, boxSize),
      startPosition,
      0xff0000, // Red for anchor
      "Anchor"
    );
    visualMeshes.push(anchorMesh);
  }

  // Create chain elements
  for (let i = 0; i < numElements; i++) {
    const yOffset = fixedPoint ? -elementSpacing * (i + 1) : -elementSpacing * i;
    const position = new THREE.Vector3(
      startPosition.x,
      startPosition.y + yOffset,
      startPosition.z
    );

    // Create physics body
    const body = new CANNON.Body({
      mass: boxMass,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: boxShape
    });

    world.addBody(body);
    bodies.push(body);

    // Create visualization for the body
    const bodyMesh = createBoxVisualization(
      scene,
      new CANNON.Vec3(boxSize, boxSize, boxSize),
      position,
      0x00aa00, // Green for chain elements
      `Chain Element ${i + 1}`
    );
    visualMeshes.push(bodyMesh);

    // Create constraint with the previous body
    if (bodies.length > 1) {  // If there's at least one previous body
      const prevBody = bodies[bodies.length - 2]; // Get the previous body
      const currentBody = bodies[bodies.length - 1]; // Get the current body

      // Create a point-to-point constraint (acts like a ball-and-socket joint)
      const constraint = new CANNON.PointToPointConstraint(
        prevBody,
        new CANNON.Vec3(0, -boxSize, 0), // Connect at the bottom of the previous body
        currentBody,
        new CANNON.Vec3(0, boxSize, 0)   // Connect at the top of the current body
      );

      world.addConstraint(constraint);
      constraints.push(constraint);

      // Create a line to visualize the constraint
      const prevBodyPos = new THREE.Vector3().copy(prevBody.position as any);
      const currentBodyPos = new THREE.Vector3().copy(currentBody.position as any);

      const startPoint = new THREE.Vector3(
        prevBodyPos.x,
        prevBodyPos.y - boxSize,
        prevBodyPos.z
      );

      const endPoint = new THREE.Vector3(
        currentBodyPos.x,
        currentBodyPos.y + boxSize,
        currentBodyPos.z
      );

      const constraintLine = createLineVisualization(
        scene,
        startPoint,
        endPoint,
        0xffffff // White for constraint lines
      );
      constraintLines.push(constraintLine);
    }
  }

  return { bodies, constraints, visualMeshes, constraintLines };
}

// Function to create a pendulum system
function createPendulum(
  world: CANNON.World,
  scene: THREE.Scene,
  startPosition: THREE.Vector3,
  numPendulums: number = 3,
  pendulumLength: number = 5,
  spacing: number = 3
): {
  bodies: CANNON.Body[],
  constraints: CANNON.PointToPointConstraint[],
  visualMeshes: THREE.Mesh[],
  constraintLines: THREE.Line[]
} {
  const bodies: CANNON.Body[] = [];
  const constraints: CANNON.PointToPointConstraint[] = [];
  const visualMeshes: THREE.Mesh[] = [];
  const constraintLines: THREE.Line[] = [];

  // Create fixed top bar
  const barSize = new CANNON.Vec3(spacing * (numPendulums + 1), 0.5, 0.5);
  const barBody = new CANNON.Body({
    mass: 0, // Static body
    position: new CANNON.Vec3(startPosition.x, startPosition.y, startPosition.z),
    shape: new CANNON.Box(barSize)
  });
  world.addBody(barBody);
  bodies.push(barBody);

  // Create visualization for the bar
  const barMesh = createBoxVisualization(
    scene,
    barSize,
    startPosition,
    0x8844ff, // Purple for the bar
    "Pendulum Bar"
  );
  visualMeshes.push(barMesh);

  // Create pendulum weights
  for (let i = 0; i < numPendulums; i++) {
    // Position along the bar
    const xOffset = -barSize.x + spacing * (i + 1);
    const radius = 1;

    const ballPosition = new THREE.Vector3(
      startPosition.x + xOffset,
      startPosition.y - pendulumLength,
      startPosition.z
    );

    // Create the pendulum weight body
    const ballBody = new CANNON.Body({
      mass: 5, // Heavier than chain elements
      position: new CANNON.Vec3(ballPosition.x, ballPosition.y, ballPosition.z),
      shape: new CANNON.Sphere(radius)
    });
    world.addBody(ballBody);
    bodies.push(ballBody);

    // Create visualization for the pendulum
    const ballMesh = createSphereVisualization(
      scene,
      radius,
      ballPosition,
      0x0088ff, // Blue for pendulum weights
      `Pendulum ${i + 1}`
    );
    visualMeshes.push(ballMesh);

    // Create constraint between bar and ball
    const constraint = new CANNON.PointToPointConstraint(
      barBody,
      new CANNON.Vec3(xOffset, 0, 0),
      ballBody,
      new CANNON.Vec3(0, radius, 0)
    );
    world.addConstraint(constraint);
    constraints.push(constraint);

    // Create a line to visualize the constraint (the pendulum string)
    const startPoint = new THREE.Vector3(startPosition.x + xOffset, startPosition.y, startPosition.z);
    const endPoint = new THREE.Vector3().copy(ballPosition).add(new THREE.Vector3(0, radius, 0));

    const constraintLine = createLineVisualization(
      scene,
      startPoint,
      endPoint,
      0xbbbbbb // Light gray for pendulum strings
    );
    constraintLines.push(constraintLine);
  }

  return { bodies, constraints, visualMeshes, constraintLines };
}

const PhysicsChain = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, gui, controls } = options;

    gui.show();

    terrain.visible = false;
    water.visible = false;

    Helpers.createHelpers(scene);

    sky.updateSunPosition(12);

    const initialCamPos = new THREE.Vector3(0, 0, 30);
    const initialLookPos = new THREE.Vector3(0, 0, 0);

    camera.animateTo(initialCamPos, initialLookPos, 200, controls);

    // Create physics world
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Standard gravity

    // Create a folder in the GUI for physics controls
    const physicsFolder = gui.addFolder('Physics Controls');

    // Create push force control
    const pushForceControl = { pushForce: PUSH_FORCE_MAGNITUDE };
    physicsFolder.add(pushForceControl, 'pushForce', 50, 1000).name('Push Force');

    // State for which body to push
    const pushState = {
      selectedBodyIndex: 0,
      targetName: 'Body 1',
      targetBody: null,
      selectBody: (index: number) => {
        if (index >= 0 && index < physicsObjects.bodies.length) {
          pushState.selectedBodyIndex = index;
          pushState.targetBody = physicsObjects.bodies[index];
          pushState.targetName = `Body ${index + 1}`;
          return index;
        }
        return pushState.selectedBodyIndex;
      }
    };

    // Add instructions to the GUI
    const instructionsFolder = gui.addFolder('Controls');
    instructionsFolder.add({ info: 'W/Up: Push Forward' }, 'info').disable();
    instructionsFolder.add({ info: 'S/Down: Push Backward' }, 'info').disable();
    instructionsFolder.add({ info: 'A/Left: Push Left' }, 'info').disable();
    instructionsFolder.add({ info: 'D/Right: Push Right' }, 'info').disable();
    instructionsFolder.add({ info: 'R: Push Upward' }, 'info').disable();
    instructionsFolder.add({ info: 'F: Push Downward' }, 'info').disable();
    instructionsFolder.add({ info: 'X: Reset Positions' }, 'info').disable();
    instructionsFolder.add({ info: 'P: Create Pendulum' }, 'info').disable();
    instructionsFolder.add({ info: 'C: Create Chain' }, 'info').disable();

    instructionsFolder.open();
    physicsFolder.open();

    // Create container for physics objects
    const physicsObjects = {
      bodies: [] as CANNON.Body[],
      constraints: [] as CANNON.PointToPointConstraint[],
      visualMeshes: [] as THREE.Mesh[],
      constraintLines: [] as THREE.Line[],

      // Function to add a new set of objects
      addObjects: (
        newBodies: CANNON.Body[],
        newConstraints: CANNON.PointToPointConstraint[],
        newMeshes: THREE.Mesh[],
        newLines: THREE.Line[]
      ) => {
        physicsObjects.bodies = [...physicsObjects.bodies, ...newBodies];
        physicsObjects.constraints = [...physicsObjects.constraints, ...newConstraints];
        physicsObjects.visualMeshes = [...physicsObjects.visualMeshes, ...newMeshes];
        physicsObjects.constraintLines = [...physicsObjects.constraintLines, ...newLines];

        // Update the selector to include new bodies
        updateBodySelector();

        // Set the last added body as selected
        if (newBodies.length > 0) {
          const newIndex = physicsObjects.bodies.length - 1;
          pushState.selectBody(newIndex);
        }
      },

      // Store initial positions for reset
      initialPositions: [] as THREE.Vector3[]
    };

    // Create the chain by default
    const chainPosition = new THREE.Vector3(0, 10, 0);
    const chain = createPhysicsChain(world, scene, chainPosition, 5, 2, true);
    physicsObjects.addObjects(chain.bodies, chain.constraints, chain.visualMeshes, chain.constraintLines);

    // Create pendulum by default
    const pendulumPosition = new THREE.Vector3(-10, 10, 0);
    const pendulum = createPendulum(world, scene, pendulumPosition, 3, 8, 3);
    physicsObjects.addObjects(pendulum.bodies, pendulum.constraints, pendulum.visualMeshes, pendulum.constraintLines);

    // Store initial positions
    physicsObjects.initialPositions = physicsObjects.bodies.map(body =>
      new THREE.Vector3().copy(body.position as any)
    );

    // Create body selection in GUI
    function updateBodySelector() {
      // Remove previous controller if it exists
      const existingController = physicsFolder.controllers.find(
        c => (c as any).property === 'selectBody'
      );
      if (existingController) {
        physicsFolder.remove(existingController);
      }

      // Create options array for selector
      const options = {};
      physicsObjects.bodies.forEach((_body, index) => {
        options[`Body ${index + 1}`] = index;
      });

      // Add new controller
      physicsFolder
        .add(pushState, 'selectedBodyIndex', options)
        .name('Push Target')
        .onChange((index: number) => {
          pushState.selectBody(index);
        });
    }

    // Initial setup of body selector
    updateBodySelector();
    pushState.selectBody(0);

    // Function to reset all objects to their initial positions
    function resetPositions() {
      physicsObjects.bodies.forEach((body, index) => {
        const initialPos = physicsObjects.initialPositions[index];
        body.position.copy(initialPos as any);
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.quaternion.set(0, 0, 0, 1);
      });
    }

    // Add reset button to GUI
    physicsFolder.add({ reset: resetPositions }, 'reset').name('Reset Positions');

    // Track currently pressed keys
    const keysPressed = new Set<string>();

    // Key down event handler
    function onKeyDown(event: KeyboardEvent) {
      keysPressed.add(event.code);

      // Reset positions with X key
      if (arrayIncludes(KEY_MAPPING.RESET_POSITION, event.code)) {
        resetPositions();
      }

      // Create a new pendulum with P key
      if (arrayIncludes(KEY_MAPPING.CREATE_PENDULUM, event.code)) {
        const randomX = Math.random() * 20 - 10;
        const pendulumPos = new THREE.Vector3(randomX, 15, 0);
        const pendulum = createPendulum(
          world,
          scene,
          pendulumPos,
          2 + Math.floor(Math.random() * 3), // 2-4 pendulums
          5 + Math.random() * 5, // 5-10 length
          2 + Math.random() * 2 // 2-4 spacing
        );
        physicsObjects.addObjects(
          pendulum.bodies,
          pendulum.constraints,
          pendulum.visualMeshes,
          pendulum.constraintLines
        );

        // Store initial positions
        physicsObjects.initialPositions = physicsObjects.bodies.map(body =>
          new THREE.Vector3().copy(body.position as any)
        );
      }

      // Create a new chain with C key
      if (arrayIncludes(KEY_MAPPING.CREATE_CHAIN, event.code)) {
        const randomX = Math.random() * 20 - 10;
        const chainPos = new THREE.Vector3(randomX, 15, 0);
        const chain = createPhysicsChain(
          world,
          scene,
          chainPos,
          3 + Math.floor(Math.random() * 5), // 3-7 elements
          1.5 + Math.random() * 1, // 1.5-2.5 spacing
          true
        );
        physicsObjects.addObjects(
          chain.bodies,
          chain.constraints,
          chain.visualMeshes,
          chain.constraintLines
        );

        // Store initial positions
        physicsObjects.initialPositions = physicsObjects.bodies.map(body =>
          new THREE.Vector3().copy(body.position as any)
        );
      }
    }

    // Key up event handler
    function onKeyUp(event: KeyboardEvent) {
      keysPressed.delete(event.code);
    }

    // Add event listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Function to apply forces based on currently pressed keys
    function applyInputForces() {
      // Get the target body
      if (!pushState.targetBody) return;
      const targetBody = pushState.targetBody;

      // Get force magnitude from the control object
      const forceMagnitude = pushForceControl.pushForce;

      // Check which keys are pressed and apply the corresponding forces
      // Forward force (W or Up Arrow)
      if (KEY_MAPPING.PUSH_UP.some(key => keysPressed.has(key))) {
        targetBody.applyForce(
          new CANNON.Vec3(0, 0, -forceMagnitude),
          new CANNON.Vec3(0, 0, 0)
        );
      }

      // Backward force (S or Down Arrow)
      if (KEY_MAPPING.PUSH_DOWN.some(key => keysPressed.has(key))) {
        targetBody.applyForce(
          new CANNON.Vec3(0, 0, forceMagnitude),
          new CANNON.Vec3(0, 0, 0)
        );
      }

      // Left force (A or Left Arrow)
      if (KEY_MAPPING.PUSH_LEFT.some(key => keysPressed.has(key))) {
        targetBody.applyForce(
          new CANNON.Vec3(-forceMagnitude, 0, 0),
          new CANNON.Vec3(0, 0, 0)
        );
      }

      // Right force (D or Right Arrow)
      if (KEY_MAPPING.PUSH_RIGHT.some(key => keysPressed.has(key))) {
        targetBody.applyForce(
          new CANNON.Vec3(forceMagnitude, 0, 0),
          new CANNON.Vec3(0, 0, 0)
        );
      }

      // Upward force (R)
      if (KEY_MAPPING.PUSH_UP_VERT.some(key => keysPressed.has(key))) {
        targetBody.applyForce(
          new CANNON.Vec3(0, forceMagnitude, 0),
          new CANNON.Vec3(0, 0, 0)
        );
      }

      // Downward force (F)
      if (KEY_MAPPING.PUSH_DOWN_VERT.some(key => keysPressed.has(key))) {
        targetBody.applyForce(
          new CANNON.Vec3(0, -forceMagnitude, 0),
          new CANNON.Vec3(0, 0, 0)
        );
      }
    }

    // Physics simulation and visualization loop
    const fps = 60; // Higher FPS for smoother physics
    const animate = () => {
      setTimeout(() => {
        requestAnimationFrame(animate);
      }, 1000 / fps);

      // Step the physics world
      world.step(1 / 60);

      // Apply forces from user input
      applyInputForces();

      // Update mesh positions to match physics bodies
      physicsObjects.bodies.forEach((body, index) => {
        if (physicsObjects.visualMeshes[index]) {
          physicsObjects.visualMeshes[index].position.copy(body.position as any);
          physicsObjects.visualMeshes[index].quaternion.copy(body.quaternion as any);
        }
      });

      // Update constraint lines
      physicsObjects.constraintLines.forEach((line, index) => {
        // Need to determine which bodies this constraint connects
        const constraint = physicsObjects.constraints[index];
        if (constraint && line.userData.updatePositions) {
          const bodyA = constraint.bodyA;
          const bodyB = constraint.bodyB;

          // Get the constraint pivot points in world space
          const pivotA = new THREE.Vector3(
            constraint.pivotA.x,
            constraint.pivotA.y,
            constraint.pivotA.z
          );
          const pivotB = new THREE.Vector3(
            constraint.pivotB.x,
            constraint.pivotB.y,
            constraint.pivotB.z
          );

          // Convert body positions to Three.js vectors
          const bodyAPos = new THREE.Vector3().copy(bodyA.position as any);
          const bodyBPos = new THREE.Vector3().copy(bodyB.position as any);

          // Apply body rotation to pivot points
          const quatA = new THREE.Quaternion().copy(bodyA.quaternion as any);
          const quatB = new THREE.Quaternion().copy(bodyB.quaternion as any);

          // Create rotated pivots
          const rotatedPivotA = pivotA.clone().applyQuaternion(quatA);
          const rotatedPivotB = pivotB.clone().applyQuaternion(quatB);

          // Calculate final connection points
          const posA = bodyAPos.clone().add(rotatedPivotA);
          const posB = bodyBPos.clone().add(rotatedPivotB);

          line.userData.updatePositions(posA, posB);
        }
      });

      // Update visualizations
      renderer.render(scene, camera);

      TWEEN.update();
      controls.update();
    };

    animate();

    // Cleanup function to remove event listeners when scene changes
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  },
};

export default PhysicsChain; 