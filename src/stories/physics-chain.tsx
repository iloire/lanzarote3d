import * as CANNON from "cannon-es";
import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import Helpers from "../utils/helpers";
import { StoryOptions } from "./types";

// Constants for force application
const PUSH_FORCE_MAGNITUDE = 800; // Strength of push when keys are pressed
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
  PLATFORM_LEFT: ['KeyQ'],           // Q: Move platform left
  PLATFORM_RIGHT: ['KeyW'],          // W: Move platform right
};

// Helper function to check if an array contains a value (compatible with older JS)
function arrayIncludes(array: string[], value: string): boolean {
  return array.indexOf(value) !== -1;
}

// Function to create UI buttons for controlling the platform
function createPlatformButtons(container: HTMLElement, platformBody: CANNON.Body, platformForce: number): {
  leftButton: HTMLButtonElement;
  rightButton: HTMLButtonElement;
  cleanup: () => void;
  applyButtonForces: () => void;
} {
  // Create container for buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.position = 'absolute';
  buttonContainer.style.bottom = '20px';
  buttonContainer.style.left = '50%';
  buttonContainer.style.transform = 'translateX(-50%)';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '20px';
  buttonContainer.style.zIndex = '1000';

  // Create left button
  const leftButton = document.createElement('button');
  leftButton.textContent = '← Move Left';
  leftButton.style.padding = '12px 20px';
  leftButton.style.fontSize = '16px';
  leftButton.style.fontWeight = 'bold';
  leftButton.style.backgroundColor = '#4285f4';
  leftButton.style.color = 'white';
  leftButton.style.border = 'none';
  leftButton.style.borderRadius = '8px';
  leftButton.style.cursor = 'pointer';
  leftButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  leftButton.style.transition = 'background-color 0.2s, transform 0.1s';

  // Create right button
  const rightButton = document.createElement('button');
  rightButton.textContent = 'Move Right →';
  rightButton.style.padding = '12px 20px';
  rightButton.style.fontSize = '16px';
  rightButton.style.fontWeight = 'bold';
  rightButton.style.backgroundColor = '#4285f4';
  rightButton.style.color = 'white';
  rightButton.style.border = 'none';
  rightButton.style.borderRadius = '8px';
  rightButton.style.cursor = 'pointer';
  rightButton.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  rightButton.style.transition = 'background-color 0.2s, transform 0.1s';

  // Add buttons to container
  buttonContainer.appendChild(leftButton);
  buttonContainer.appendChild(rightButton);

  // Add container to the DOM
  container.appendChild(buttonContainer);

  // Track button press state
  const buttonState = {
    leftPressed: false,
    rightPressed: false
  };

  // Button event handlers
  function onLeftMouseDown() {
    buttonState.leftPressed = true;
    leftButton.style.backgroundColor = '#3367d6';
    leftButton.style.transform = 'translateY(2px)';
  }

  function onRightMouseDown() {
    buttonState.rightPressed = true;
    rightButton.style.backgroundColor = '#3367d6';
    rightButton.style.transform = 'translateY(2px)';
  }

  function onLeftMouseUp() {
    buttonState.leftPressed = false;
    leftButton.style.backgroundColor = '#4285f4';
    leftButton.style.transform = 'translateY(0)';
  }

  function onRightMouseUp() {
    buttonState.rightPressed = false;
    rightButton.style.backgroundColor = '#4285f4';
    rightButton.style.transform = 'translateY(0)';
  }

  // Add event listeners
  leftButton.addEventListener('mousedown', onLeftMouseDown);
  leftButton.addEventListener('touchstart', onLeftMouseDown);
  leftButton.addEventListener('mouseup', onLeftMouseUp);
  leftButton.addEventListener('mouseleave', onLeftMouseUp);
  leftButton.addEventListener('touchend', onLeftMouseUp);

  rightButton.addEventListener('mousedown', onRightMouseDown);
  rightButton.addEventListener('touchstart', onRightMouseDown);
  rightButton.addEventListener('mouseup', onRightMouseUp);
  rightButton.addEventListener('mouseleave', onRightMouseUp);
  rightButton.addEventListener('touchend', onRightMouseUp);

  // Function to apply forces based on button state
  function applyButtonForces() {
    if (buttonState.leftPressed) {
      platformBody.applyForce(
        new CANNON.Vec3(-platformForce, 0, 0),
        new CANNON.Vec3(0, 0, 0)
      );
    }
    if (buttonState.rightPressed) {
      platformBody.applyForce(
        new CANNON.Vec3(platformForce, 0, 0),
        new CANNON.Vec3(0, 0, 0)
      );
    }
  }

  // Cleanup function to remove event listeners
  function cleanup() {
    leftButton.removeEventListener('mousedown', onLeftMouseDown);
    leftButton.removeEventListener('touchstart', onLeftMouseDown);
    leftButton.removeEventListener('mouseup', onLeftMouseUp);
    leftButton.removeEventListener('mouseleave', onLeftMouseUp);
    leftButton.removeEventListener('touchend', onLeftMouseUp);

    rightButton.removeEventListener('mousedown', onRightMouseDown);
    rightButton.removeEventListener('touchstart', onRightMouseDown);
    rightButton.removeEventListener('mouseup', onRightMouseUp);
    rightButton.removeEventListener('mouseleave', onRightMouseUp);
    rightButton.removeEventListener('touchend', onRightMouseUp);

    container.removeChild(buttonContainer);
  }

  return {
    leftButton,
    rightButton,
    cleanup,
    applyButtonForces
  };
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

// Function to create a rope connecting two bodies
function createRope(
  world: CANNON.World,
  scene: THREE.Scene,
  bodyA: CANNON.Body,
  bodyB: CANNON.Body,
  numSegments: number = 8,
  ropeThickness: number = 2.2
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

  // Add original bodies to our collection
  bodies.push(bodyA, bodyB);

  // Calculate positions for rope segments
  const startPos = new THREE.Vector3().copy(bodyA.position as any);
  const endPos = new THREE.Vector3().copy(bodyB.position as any);
  const direction = new THREE.Vector3().subVectors(endPos, startPos);

  // Create rope segment shape
  const segmentRadius = ropeThickness;
  const segmentShape = new CANNON.Sphere(segmentRadius);
  const segmentMass = 0.1; // Light segments for more rope-like behavior

  // Create rope segments
  const segmentBodies: CANNON.Body[] = [];

  for (let i = 0; i < numSegments; i++) {
    // Calculate position for this segment
    const t = (i + 1) / (numSegments + 1);
    const segmentPos = new THREE.Vector3().lerpVectors(startPos, endPos, t);

    // Add some slack/curve to the rope - increased for longer ropes
    const sag = 0.1; // Increased from 0.1 to 0.3 for more pronounced drooping
    const offset = Math.sin(Math.PI * t) * sag * direction.length();
    segmentPos.y -= offset;

    // Create the physics body
    const segmentBody = new CANNON.Body({
      mass: segmentMass,
      position: new CANNON.Vec3(segmentPos.x, segmentPos.y, segmentPos.z),
      shape: segmentShape
    });

    // Increase damping for more stable rope
    segmentBody.linearDamping = 0.8;  // Increased from 0.5
    segmentBody.angularDamping = 0.8; // Increased from 0.5

    world.addBody(segmentBody);
    segmentBodies.push(segmentBody);
    bodies.push(segmentBody);

    // Create visualization
    const segmentMesh = createSphereVisualization(
      scene,
      segmentRadius,
      segmentPos,
      0x886644 // Brown color for rope
    );
    visualMeshes.push(segmentMesh);
  }

  // Create constraints between segments
  let prevBody = bodyA;

  // Connect each segment with a constraint
  for (let i = 0; i < segmentBodies.length; i++) {
    const currentBody = segmentBodies[i];

    // Create constraint from previous body to this one
    const constraint = new CANNON.PointToPointConstraint(
      prevBody,
      new CANNON.Vec3(0, 0, 0), // Connect from center of previous body
      currentBody,
      new CANNON.Vec3(0, 0, 0)  // Connect to center of current body
    );


    // Add position correction to constraints
    constraint.collideConnected = false;  // Don't let constrained bodies collide

    world.addConstraint(constraint);
    constraints.push(constraint);

    // Create visualization for constraint
    const prevBodyPos = new THREE.Vector3().copy(prevBody.position as any);
    const currentBodyPos = new THREE.Vector3().copy(currentBody.position as any);

    const constraintLine = createLineVisualization(
      scene,
      prevBodyPos,
      currentBodyPos,
      0x886644 // Brown color for rope
    );
    constraintLines.push(constraintLine);

    prevBody = currentBody;
  }

  // Connect last segment to bodyB
  const finalConstraint = new CANNON.PointToPointConstraint(
    prevBody,
    new CANNON.Vec3(0, 0, 0), // Connect from center of last segment
    bodyB,
    new CANNON.Vec3(0, 0, 0)  // Connect to center of bodyB
  );

  // Add position correction to final constraint
  finalConstraint.collideConnected = false;  // Don't let constrained bodies collide

  world.addConstraint(finalConstraint);
  constraints.push(finalConstraint);

  // Create visualization for final constraint
  const lastBodyPos = new THREE.Vector3().copy(prevBody.position as any);
  const endBodyPos = new THREE.Vector3().copy(bodyB.position as any);

  const finalConstraintLine = createLineVisualization(
    scene,
    lastBodyPos,
    endBodyPos,
    0x886644 // Brown color for rope
  );
  constraintLines.push(finalConstraintLine);

  return {
    bodies,
    constraints,
    visualMeshes: [visualMeshes[0], ...visualMeshes, visualMeshes[visualMeshes.length - 1]],
    constraintLines
  };
}

const PhysicsChain = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, sky, gui, controls } = options;

    gui.show();

    terrain.visible = true;
    water.visible = true;

    Helpers.createHelpers(scene);

    sky.updateSunPosition(12);

    // Adjust camera position to better view the longer ropes
    const initialCamPos = new THREE.Vector3(0, 5, 50); // Further back and lower view angle
    const initialLookPos = new THREE.Vector3(0, -5, 0); // Look slightly downward

    camera.animateTo(initialCamPos, initialLookPos, 200, controls);

    // Create physics world
    const world = new CANNON.World();
    // world.gravity.set(0, -9.82, 0); // Standard gravity

    // Add stability settings
    // @ts-ignore - CANNON.js typings might not include all solver properties
    world.solver.iterations = 10;  // Default is usually 10, increasing helps with stability
    // @ts-ignore - CANNON.js typings might not include all solver properties
    world.solver.tolerance = 0.001;  // Smaller tolerance for more accurate solutions

    // Create a folder in the GUI for physics controls
    const physicsFolder = gui.addFolder('Physics Controls');

    // Create push force control
    const pushForceControl = {
      pushForce: PUSH_FORCE_MAGNITUDE,
      sphereMass: 150, // Default even heavier sphere
      platformForce: 500, // Force for platform movement
      showButtons: true // Show UI buttons by default
    };
    physicsFolder.add(pushForceControl, 'pushForce', 50, 1500).name('Push Force');
    physicsFolder.add(pushForceControl, 'platformForce', 100, 2000).name('Platform Force');
    physicsFolder.add(pushForceControl, 'showButtons').name('Show UI Buttons');

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
    instructionsFolder.add({ info: 'Q: Move Platform Left' }, 'info').disable();
    instructionsFolder.add({ info: 'W: Move Platform Right' }, 'info').disable();
    instructionsFolder.add({ info: 'Arrow Up: Push Forward' }, 'info').disable();
    instructionsFolder.add({ info: 'Arrow Down: Push Backward' }, 'info').disable();
    instructionsFolder.add({ info: 'Arrow Left: Push Left' }, 'info').disable();
    instructionsFolder.add({ info: 'Arrow Right: Push Right' }, 'info').disable();
    instructionsFolder.add({ info: 'R: Push Upward' }, 'info').disable();
    instructionsFolder.add({ info: 'F: Push Downward' }, 'info').disable();
    instructionsFolder.add({ info: 'X: Reset Positions' }, 'info').disable();
    instructionsFolder.add({ info: 'P: Create Pendulum' }, 'info').disable();
    instructionsFolder.add({ info: 'C: Create Chain' }, 'info').disable();
    instructionsFolder.add({ info: 'Mouse: Click and drag to move platform' }, 'info').disable();

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

        // Set the last added body as selected
        if (newBodies.length > 0) {
          const newIndex = physicsObjects.bodies.length - 1;
          pushState.selectBody(newIndex);
        }
      },

      // Store initial positions for reset
      initialPositions: [] as THREE.Vector3[]
    };

    // Create a rectangular platform with four pendulums

    // Create rectangular platform (anchor)
    const platformWidth = 12;
    const platformHeight = 1;
    const platformDepth = 4;
    const platformPos = new THREE.Vector3(0, 10, 0);

    const platformShape = new CANNON.Box(new CANNON.Vec3(
      platformWidth / 2,
      platformHeight / 2,
      platformDepth / 2
    ));

    const platformBody = new CANNON.Body({
      mass: 3, // Small mass instead of static
      position: new CANNON.Vec3(platformPos.x, platformPos.y, platformPos.z),
      shape: platformShape,
      type: CANNON.Body.DYNAMIC,
      linearDamping: 0.5,
      angularDamping: 0.5
    });

    // Add constraints to limit platform movement - modified to allow horizontal and vertical movement

    // Create a distance constraint instead of a point constraint to allow more movement
    // @ts-ignore - CANNON.js typings might not include DistanceConstraint
    //world.addConstraint(pendulumConstraint);

    world.addBody(platformBody);

    // Create visualization for platform
    const platformMesh = createBoxVisualization(
      scene,
      new CANNON.Vec3(platformWidth / 2, platformHeight / 2, platformDepth / 2),
      platformPos,
      0xff0000, // Red for platform
      "Platform"
    );

    // Add platform to objects
    physicsObjects.bodies.push(platformBody);
    physicsObjects.visualMeshes.push(platformMesh);

    // Define four attachment points on the platform
    const attachmentPoints = [
      { x: -platformWidth / 3, z: -platformDepth / 3 },
      { x: platformWidth / 3, z: -platformDepth / 3 },
      { x: -platformWidth / 3, z: platformDepth / 3 },
      { x: platformWidth / 3, z: platformDepth / 3 }
    ];

    // Create a single sphere below the platform
    const sphereRadius = 1.5; // Reduced from 5.0 to 1.5
    const ropeLength = 24; // Much longer rope (3x the original 8 units)
    const spherePos = new THREE.Vector3(platformPos.x, platformPos.y - ropeLength, platformPos.z);
    const sphereShape = new CANNON.Sphere(sphereRadius);
    const sphereBody = new CANNON.Body({
      mass: pushForceControl.sphereMass, // Use the configurable mass
      position: new CANNON.Vec3(spherePos.x, spherePos.y, spherePos.z),
      shape: sphereShape,
      linearDamping: 0.7, // Increased from 0.3 to reduce oscillation
      angularDamping: 0.7  // Increased from 0.3 to reduce oscillation
    });
    world.addBody(sphereBody);

    // Add mass controller specifically for the main sphere
    const massController = physicsFolder.add(pushForceControl, 'sphereMass', 10, 1200).name('Sphere Mass');
    massController.onChange((value: number) => {
      // Update the sphere's mass when the slider changes
      sphereBody.mass = value;
      sphereBody.updateMassProperties();
    });

    // Create visualization for the sphere
    const sphereMesh = createSphereVisualization(
      scene,
      sphereRadius,
      spherePos,
      0x0088ff, // Blue for the main sphere
      "Sphere"
    );

    // Add sphere to objects
    physicsObjects.bodies.push(sphereBody);
    physicsObjects.visualMeshes.push(sphereMesh);

    // Create 4 ropes from different attachment points to the sphere
    const ropeColors = [0xff8800, 0x00ff88, 0x8800ff, 0xffff00]; // Different colors for each rope

    for (let i = 0; i < 4; i++) {
      const attachPoint = attachmentPoints[i];

      // Calculate the attachment point on the platform
      const platformAttachPoint = new CANNON.Vec3(attachPoint.x, -platformHeight / 2, attachPoint.z);

      // Attach to the center of the sphere instead of distributing around it
      const sphereAttachPoint = new CANNON.Vec3(0, 0, 0);

      // Create rope connecting the two bodies - more segments for the longer rope
      const rope = createRope(
        world,
        scene,
        platformBody,
        sphereBody,
        20, // Tripled the number of segments for longer rope
        0.15, // Rope thickness
      );

      // Set the specific attachment points for this rope
      if (rope.constraints.length > 0) {
        // Set platform attachment point
        const firstConstraint = rope.constraints[0];
        firstConstraint.pivotA = platformAttachPoint;

        // Set sphere attachment point
        const lastConstraint = rope.constraints[rope.constraints.length - 1];
        lastConstraint.pivotB = sphereAttachPoint;

        // Update the rope visualization to match the new pivot points
        if (rope.constraintLines.length > 0) {
          // Update the first line
          const platformWorldPos = new THREE.Vector3().copy(platformBody.position as any);
          const firstSegmentPos = new THREE.Vector3().copy(rope.bodies[2].position as any);

          const startPoint = platformWorldPos.clone().add(
            new THREE.Vector3(attachPoint.x, -platformHeight / 2, attachPoint.z)
          );

          rope.constraintLines[0].userData.updatePositions(
            startPoint,
            firstSegmentPos
          );

          // Update the line color for this rope
          rope.constraintLines.forEach(line => {
            const material = line.material as THREE.LineBasicMaterial;
            material.color.set(ropeColors[i]);
          });
        }
      }

      // Add rope segments and constraints to objects
      physicsObjects.addObjects(
        [...rope.bodies.slice(2)], // Skip platform and sphere as they're already added
        rope.constraints,
        [...rope.visualMeshes.slice(2)], // Skip platform and sphere meshes
        rope.constraintLines
      );
    }

    // Store initial positions
    physicsObjects.initialPositions = physicsObjects.bodies.map(body =>
      new THREE.Vector3().copy(body.position as any)
    );

    // Initial setup of body selector
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
        const randomZ = Math.random() * 10 - 5;

        // Create platform
        const platformWidth = 6 + Math.random() * 4; // 6-10 width
        const platformHeight = 0.5 + Math.random() * 1; // 0.5-1.5 height
        const platformDepth = 2 + Math.random() * 3; // 2-5 depth

        const platformPos = new THREE.Vector3(randomX, 15, randomZ);
        const platformShape = new CANNON.Box(new CANNON.Vec3(
          platformWidth / 2,
          platformHeight / 2,
          platformDepth / 2
        ));

        const platformBody = new CANNON.Body({
          mass: 3, // Small mass instead of static (so it can be shaken)
          position: new CANNON.Vec3(platformPos.x, platformPos.y, platformPos.z),
          shape: platformShape,
          type: CANNON.Body.DYNAMIC,
          linearDamping: 0.5,
          angularDamping: 0.5
        });

        // Add constraints to limit platform movement (so it doesn't fall)
        const pendulumFixedPoint = new CANNON.Vec3(platformPos.x, platformPos.y, platformPos.z);
        const pendulumConstraint = new CANNON.PointToPointConstraint(
          platformBody,
          new CANNON.Vec3(0, 0, 0), // Local point in body
          new CANNON.Body({ mass: 0 }), // Static body
          pendulumFixedPoint // World point
        );
        world.addConstraint(pendulumConstraint);

        world.addBody(platformBody);

        // Create visualization for platform
        const platformMesh = createBoxVisualization(
          scene,
          new CANNON.Vec3(platformWidth / 2, platformHeight / 2, platformDepth / 2),
          platformPos,
          0xff00ff, // Purple for new platform
          `Platform ${physicsObjects.bodies.length + 1}`
        );

        // Define attachment points on the platform
        const attachmentPoints = [
          { x: -platformWidth / 3, z: -platformDepth / 3 },
          { x: platformWidth / 3, z: -platformDepth / 3 },
          { x: -platformWidth / 3, z: platformDepth / 3 },
          { x: platformWidth / 3, z: platformDepth / 3 }
        ];

        // Create sphere below the platform - much further down
        const sphereRadius = 0.8 + Math.random() * 0.7; // 0.8-1.5 radius (reduced from 2.5-5)
        const ropeLength = 12 + Math.random() * 12; // 12-24 units length (3x longer)
        const spherePos = new THREE.Vector3(
          platformPos.x,
          platformPos.y - ropeLength,
          platformPos.z
        );

        const sphereShape = new CANNON.Sphere(sphereRadius);
        const sphereBody = new CANNON.Body({
          mass: 10 + Math.random() * 15, // 10-25 mass (increased from 3-8)
          position: new CANNON.Vec3(spherePos.x, spherePos.y, spherePos.z),
          shape: sphereShape,
          linearDamping: 0.2 + Math.random() * 0.2, // 0.2-0.4 damping
          angularDamping: 0.2 + Math.random() * 0.2 // 0.2-0.4 damping
        });
        world.addBody(sphereBody);

        // Create visualization for sphere
        const sphereMesh = createSphereVisualization(
          scene,
          sphereRadius,
          spherePos,
          0xff8800, // Orange for new sphere
          `Sphere ${physicsObjects.bodies.length + 2}`
        );

        // Add both bodies to collection first
        const newBodies = [platformBody, sphereBody];
        const newMeshes = [platformMesh, sphereMesh];
        let newConstraints: CANNON.PointToPointConstraint[] = [];
        let newLines: THREE.Line[] = [];

        // Create 4 ropes connecting the platform to the sphere
        const ropeColors = [0xff8800, 0x00ff88, 0x8800ff, 0xffff00];

        for (let i = 0; i < 4; i++) {
          const attachPoint = attachmentPoints[i];

          // Platform attachment point
          const platformAttachPoint = new CANNON.Vec3(attachPoint.x, -platformHeight / 2, attachPoint.z);

          // Attach to the center of the sphere instead of distributing around it
          const sphereAttachPoint = new CANNON.Vec3(0, 0, 0);

          // Create rope connecting the two bodies - more segments for the longer rope
          const rope = createRope(
            world,
            scene,
            platformBody,
            sphereBody,
            12 + Math.floor(Math.random() * 6), // 12-18 segments (3x more)
            0.1 + Math.random() * 0.1 // 0.1-0.2 thickness
          );

          // Adjust attachment points
          if (rope.constraints.length > 0) {
            // Platform attachment
            const firstConstraint = rope.constraints[0];
            firstConstraint.pivotA = platformAttachPoint;

            // Sphere attachment
            const lastConstraint = rope.constraints[rope.constraints.length - 1];
            lastConstraint.pivotB = sphereAttachPoint;

            // Update rope visuals
            if (rope.constraintLines.length > 0) {
              const platformWorldPos = new THREE.Vector3().copy(platformBody.position as any);
              const firstSegmentPos = new THREE.Vector3().copy(rope.bodies[2].position as any);

              const startPoint = platformWorldPos.clone().add(
                new THREE.Vector3(attachPoint.x, -platformHeight / 2, attachPoint.z)
              );

              rope.constraintLines[0].userData.updatePositions(
                startPoint,
                firstSegmentPos
              );

              // Set rope color
              rope.constraintLines.forEach(line => {
                const material = line.material as THREE.LineBasicMaterial;
                material.color.set(ropeColors[i]);
              });
            }
          }

          // Add only the rope segments and constraints
          newBodies.push(...rope.bodies.slice(2));
          newMeshes.push(...rope.visualMeshes.slice(2));
          newConstraints = [...newConstraints, ...rope.constraints];
          newLines = [...newLines, ...rope.constraintLines];
        }

        // Add all new objects to collections
        physicsObjects.addObjects(newBodies, newConstraints, newMeshes, newLines);

        // Store initial positions
        physicsObjects.initialPositions = physicsObjects.bodies.map(body =>
          new THREE.Vector3().copy(body.position as any)
        );
      }

      // Create a new chain with C key
      if (arrayIncludes(KEY_MAPPING.CREATE_CHAIN, event.code)) {
        const randomX = Math.random() * 20 - 10;

        // Create anchor body at the top
        const newAnchorPos = new THREE.Vector3(randomX, 15, 0);
        const anchorShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
        const newAnchorBody = new CANNON.Body({
          mass: 3, // Small mass instead of static (so it can be moved)
          position: new CANNON.Vec3(newAnchorPos.x, newAnchorPos.y, newAnchorPos.z),
          shape: anchorShape,
          type: CANNON.Body.DYNAMIC,
          linearDamping: 0.5,
          angularDamping: 0.5
        });

        // Add constraints to limit platform movement (so it doesn't fall)
        const anchorFixedPoint = new CANNON.Vec3(newAnchorPos.x, newAnchorPos.y, newAnchorPos.z);
        const anchorConstraint = new CANNON.PointToPointConstraint(
          newAnchorBody,
          new CANNON.Vec3(0, 0, 0), // Local point in body
          new CANNON.Body({ mass: 0 }), // Static body
          anchorFixedPoint // World point
        );
        world.addConstraint(anchorConstraint);

        world.addBody(newAnchorBody);

        // Create visualization for anchor
        const newAnchorMesh = createBoxVisualization(
          scene,
          new CANNON.Vec3(1, 1, 1),
          newAnchorPos,
          0xff0000, // Red for anchor
          `Anchor ${physicsObjects.bodies.length + 1}`
        );

        // Create weight at the bottom
        const newWeightPos = new THREE.Vector3(randomX, 0, 0);
        const weightRadius = 1 + Math.random();
        const weightShape = new CANNON.Sphere(weightRadius);
        const newWeightBody = new CANNON.Body({
          mass: 3 + Math.random() * 5,
          position: new CANNON.Vec3(newWeightPos.x, newWeightPos.y, newWeightPos.z),
          shape: weightShape
        });
        world.addBody(newWeightBody);

        // Create visualization for weight
        const newWeightMesh = createSphereVisualization(
          scene,
          weightRadius,
          newWeightPos,
          0x0088ff, // Blue for weight
          `Weight ${physicsObjects.bodies.length + 2}`
        );

        // Connect with rope
        const segments = 3 + Math.floor(Math.random() * 5); // 3-7 segments
        const newRope = createRope(
          world,
          scene,
          newAnchorBody,
          newWeightBody,
          segments,
          0.1 + Math.random() * 0.2 // Random thickness
        );

        // Add all objects to our collections
        physicsObjects.addObjects(
          [newAnchorBody, newWeightBody, ...newRope.bodies.slice(2)],
          newRope.constraints,
          [newAnchorMesh, newWeightMesh, ...newRope.visualMeshes.slice(2)],
          newRope.constraintLines
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

    // Create UI buttons for platform control
    const buttons = createPlatformButtons(
      renderer.domElement.parentElement || document.body,
      platformBody,
      pushForceControl.platformForce
    );

    // Listen for changes to platform force
    physicsFolder.controllers.find(c => (c as any).property === 'platformForce')?.onChange((value: number) => {
      pushForceControl.platformForce = value;
    });

    // Listen for changes to button visibility
    physicsFolder.controllers.find(c => (c as any).property === 'showButtons')?.onChange((value: boolean) => {
      buttons.leftButton.parentElement!.style.display = value ? 'flex' : 'none';
    });

    // Function to apply forces based on currently pressed keys
    function applyInputForces() {
      // Get the target body
      if (!pushState.targetBody) return;
      const targetBody = pushState.targetBody;

      // Get force magnitude from the control object
      const forceMagnitude = pushForceControl.pushForce;

      // Handle platform movement with Q and W keys
      if (physicsObjects.bodies.length > 0 && platformBody) {
        const platformMovementForce = pushForceControl.platformForce;

        // Move platform left (Q)
        if (KEY_MAPPING.PLATFORM_LEFT.some(key => keysPressed.has(key))) {
          platformBody.applyForce(
            new CANNON.Vec3(-platformMovementForce, 0, 0),
            new CANNON.Vec3(0, 0, 0)
          );
        }

        // Move platform right (W)
        if (KEY_MAPPING.PLATFORM_RIGHT.some(key => keysPressed.has(key))) {
          platformBody.applyForce(
            new CANNON.Vec3(platformMovementForce, 0, 0),
            new CANNON.Vec3(0, 0, 0)
          );
        }
      }

      // Apply forces from UI buttons
      buttons.applyButtonForces();

      // Check which keys are pressed and apply the corresponding forces
      // Forward force (Up Arrow)
      if (KEY_MAPPING.PUSH_UP.some(key => keysPressed.has(key)) &&
        !KEY_MAPPING.PLATFORM_RIGHT.some(key => keysPressed.has(key))) { // Avoid double-triggering with W
        targetBody.applyForce(
          new CANNON.Vec3(0, 0, -forceMagnitude),
          new CANNON.Vec3(0, 0, 0)
        );
      }

      // Backward force (Down Arrow)
      if (KEY_MAPPING.PUSH_DOWN.some(key => keysPressed.has(key))) {
        targetBody.applyForce(
          new CANNON.Vec3(0, 0, forceMagnitude),
          new CANNON.Vec3(0, 0, 0)
        );
      }

      // Left force (Left Arrow)
      if (KEY_MAPPING.PUSH_LEFT.some(key => keysPressed.has(key))) {
        targetBody.applyForce(
          new CANNON.Vec3(-forceMagnitude, 0, 0),
          new CANNON.Vec3(0, 0, 0)
        );
      }

      // Right force (Right Arrow)
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

    function applyForces() {
      // gravity
      // apply gravity force to platform
      platformBody.applyForce(
        new CANNON.Vec3(0, -9.82 * platformBody.mass, 0),
        new CANNON.Vec3(0, 0, 0)
      );

      // apply gravity force to sphere
      sphereBody.applyForce(
        new CANNON.Vec3(0, -9.82 * sphereBody.mass, 0),
        new CANNON.Vec3(0, 0, 0)
      );

      // lift
      // apply lift force to platform in the direction perpendicular to the platform's forward vector
      platformBody.applyForce(
        new CANNON.Vec3(0, 9.92 * sphereBody.mass, 0),
        new CANNON.Vec3(0, 0, 0)
      );

      // apply a force on the direction of wehre the platform is pointing 
      const platformForward = new THREE.Vector3().copy(platformBody.quaternion as any).multiply(new THREE.Vector3(1, 0, 0));
      const forwardForceMagnitude = 1320;
      platformBody.applyForce(
        new CANNON.Vec3(platformForward.x * forwardForceMagnitude, platformForward.y * forwardForceMagnitude, platformForward.z * forwardForceMagnitude),
        new CANNON.Vec3(0, 0, 0)
      );

      // apply force to the edge of the platform for a rotation effect
      // platformBody.applyForce(
      //   new CANNON.Vec3(120, 0, 10),
      //   new CANNON.Vec3(5, 0, 0)
      // );
    }
    // Physics simulation and visualization loop
    const fps = 260; // Higher FPS for smoother physics
    const animate = () => {
      setTimeout(() => {
        requestAnimationFrame(animate);
      }, 1000 / fps);

      // Step the physics world with more sub-steps for stability
      world.step(1 / 60);

      // apply physics to objects
      applyForces();

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
      buttons.cleanup();
    };
  },
};

export default PhysicsChain; 