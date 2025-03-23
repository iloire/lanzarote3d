import * as CANNON from "cannon-es";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PhysicsObjects } from "./helpers";
import { createBoxVisualization, createSphereVisualization } from "./visualization";

/**
 * Interface for the basic physics scene setup
 */
export interface PhysicsScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  world: CANNON.World;
  physicsObjects: PhysicsObjects;
  platformBody: CANNON.Body;
  sphereBody: CANNON.Body;
  animate: () => void;
  cleanup: () => void;
}

/**
 * Setup lighting for the scene
 */
function setupLighting(scene: THREE.Scene): void {
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;

  // Configure shadow properties
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;

  // Expand shadow bounds for large scenes
  const d = 30;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;

  scene.add(directionalLight);
}

/**
 * Create platform and sphere bodies for the basic simulation
 */
export function createBasicPhysicsObjects(
  scene: THREE.Scene,
  world: CANNON.World
): {
  physicsObjects: PhysicsObjects;
  platformBody: CANNON.Body;
  sphereBody: CANNON.Body;
} {
  // Create container for physics objects
  const physicsObjects: PhysicsObjects = {
    bodies: [],
    constraints: [],
    visualMeshes: [],
    constraintLines: [],
    initialPositions: [],
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
    }
  };

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
    mass: 10,
    position: new CANNON.Vec3(platformPos.x, platformPos.y, platformPos.z),
    shape: platformShape,
    type: CANNON.Body.DYNAMIC,
    linearDamping: 0.5,
    angularDamping: 0.5
  });

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

  // Create a single sphere below the platform
  const sphereRadius = 1.5;
  const ropeLength = 24;
  const spherePos = new THREE.Vector3(platformPos.x, platformPos.y - ropeLength, platformPos.z);
  const sphereShape = new CANNON.Sphere(sphereRadius);

  const sphereBody = new CANNON.Body({
    mass: 80,
    position: new CANNON.Vec3(spherePos.x, spherePos.y, spherePos.z),
    shape: sphereShape,
    linearDamping: 0.7,
    angularDamping: 0.7
  });
  world.addBody(sphereBody);

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

  return { physicsObjects, platformBody, sphereBody };
}

/**
 * Update the visuals to match physics
 */
export function updateVisuals(physicsObjects: PhysicsObjects): void {
  // Update bodies and their meshes
  physicsObjects.bodies.forEach((body, i) => {
    const mesh = physicsObjects.visualMeshes[i];
    if (mesh) {
      mesh.position.copy(body.position as any);
      mesh.quaternion.copy(body.quaternion as any);
    }
  });

  // Update lines for constraints
  physicsObjects.constraints.forEach((constraint, i) => {
    const line = physicsObjects.constraintLines[i];
    if (line) {
      const positionAttribute = line.geometry.attributes.position;

      if (positionAttribute instanceof THREE.BufferAttribute) {
        const bodyA = constraint.bodyA;
        const bodyB = constraint.bodyB;

        if (bodyA && bodyB) {
          // Calculate world positions for constraint endpoints
          const worldPointA = new CANNON.Vec3();
          bodyA.pointToWorldFrame(constraint.pivotA, worldPointA);

          const worldPointB = new CANNON.Vec3();
          bodyB.pointToWorldFrame(constraint.pivotB, worldPointB);

          // Update the line geometry to connect the actual attachment points
          positionAttribute.setXYZ(0, worldPointA.x, worldPointA.y, worldPointA.z);
          positionAttribute.setXYZ(1, worldPointB.x, worldPointB.y, worldPointB.z);
          positionAttribute.needsUpdate = true;
        }
      }
    }
  });
}

// Export the setupScene function so it can be used in index.tsx
export function setupScene(container: HTMLElement): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
} {
  // Create a scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue background

  // Create a camera
  const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near plane
    1000 // Far plane
  );

  // Set initial camera position
  camera.position.set(10, 20, 30);
  camera.lookAt(0, 0, 0);

  // Create a renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Add renderer to container
  container.appendChild(renderer.domElement);

  // Create camera controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Add window resize handler
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('resize', handleResize);

  // Add basic lighting to the scene
  setupLighting(scene);

  return { scene, camera, renderer, controls };
} 