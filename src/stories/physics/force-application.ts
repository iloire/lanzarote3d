import * as CANNON from "cannon-es";
import * as THREE from "three";
import { VectorVisualizater } from "../../utils/vector-visualizer";

interface ForceApplicationParams {
  gliderBody: CANNON.Body;
  pilotBody: CANNON.Body;
  vectorVisualizer: VectorVisualizater;
  leftBreakForce: number;
  rightBreakForce: number;
}

const LIFT_POINTS = [
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

const DRAG_POINTS = [
  { x: 0, z: -6 },  // Front
  { x: 0, z: 6 },   // Back
  { x: -6, z: 0 },  // Left
  { x: 6, z: 0 }    // Right
];

const LEFT_BREAK_POINTS = [
  { x: -8, z: 0, weight: 0.5 },
  { x: -12, z: 0, weight: 0.5 }
];

const RIGHT_BREAK_POINTS = [
  { x: 8, z: 0, weight: 0.5 },
  { x: 12, z: 0, weight: 0.5 }
];

export function applyLiftForce(
  gliderBody: CANNON.Body,
  pilotBody: CANNON.Body,
  vectorVisualizer: VectorVisualizater,
  scale: number = 1.0 // Default scale is 1.0
): void {
  const baseLiftMagnitude = 9.82 * pilotBody.mass * scale;

  LIFT_POINTS.forEach((point, index) => {
    const localLiftVector = new CANNON.Vec3(0, baseLiftMagnitude * point.weight, 0);
    const localPoint = new CANNON.Vec3(point.x, 0, point.z);

    const worldLiftVector = new CANNON.Vec3();
    const worldPoint = new CANNON.Vec3();
    gliderBody.vectorToWorldFrame(localLiftVector, worldLiftVector);
    gliderBody.pointToWorldFrame(localPoint, worldPoint);

    gliderBody.applyLocalForce(localLiftVector, localPoint);

    vectorVisualizer.addForce({
      name: `LIFT_${index}`,
      color: 0x00ff00, // Green
      position: new THREE.Vector3(worldPoint.x, worldPoint.y, worldPoint.z),
      vector: worldLiftVector,
      scale: 0.01 * 0.2,
    });
  });
}

export function applyDragForce(
  gliderBody: CANNON.Body,
  pilotBody: CANNON.Body,
  vectorVisualizer: VectorVisualizater
): void {
  const glideDirection = gliderBody.velocity.clone();
  const speed = glideDirection.length();

  if (speed > 0.001) {
    glideDirection.normalize();
  }

  const dragVector = glideDirection.negate();
  const baseDragMagnitude = 5 * pilotBody.mass * (speed * speed * 0.01); // Quadratic drag

  DRAG_POINTS.forEach((point, index) => {
    const localDragVector = dragVector.scale(baseDragMagnitude * 0.25);
    const localPoint = new CANNON.Vec3(point.x, 0, point.z);

    const worldDragVector = new CANNON.Vec3();
    const worldPoint = new CANNON.Vec3();
    gliderBody.vectorToWorldFrame(localDragVector, worldDragVector);
    gliderBody.pointToWorldFrame(localPoint, worldPoint);

    gliderBody.applyForce(worldDragVector, worldPoint);

    vectorVisualizer.addForce({
      name: `DRAG_${index}`,
      color: 0xff0000, // Red
      position: new THREE.Vector3(worldPoint.x, worldPoint.y, worldPoint.z),
      vector: worldDragVector,
      scale: 0.01 * 0.2,
    });
  });
}

export function applyBreakForces(
  gliderBody: CANNON.Body,
  pilotBody: CANNON.Body,
  vectorVisualizer: VectorVisualizater,
  leftBreakForce: number,
  rightBreakForce: number
): void {
  const breakMagnitude = leftBreakForce * pilotBody.mass;

  if (leftBreakForce > 0) {
    LEFT_BREAK_POINTS.forEach((point, index) => {
      const localBreakVector = new CANNON.Vec3(-breakMagnitude * point.weight, 0, 0);
      const localPoint = new CANNON.Vec3(point.x, 0, point.z);

      const worldBreakVector = new CANNON.Vec3();
      const worldPoint = new CANNON.Vec3();
      gliderBody.vectorToWorldFrame(localBreakVector, worldBreakVector);
      gliderBody.pointToWorldFrame(localPoint, worldPoint);

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

  if (rightBreakForce > 0) {
    RIGHT_BREAK_POINTS.forEach((point, index) => {
      const localBreakVector = new CANNON.Vec3(breakMagnitude * point.weight, 0, 0);
      const localPoint = new CANNON.Vec3(point.x, 0, point.z);

      const worldBreakVector = new CANNON.Vec3();
      const worldPoint = new CANNON.Vec3();
      gliderBody.vectorToWorldFrame(localBreakVector, worldBreakVector);
      gliderBody.pointToWorldFrame(localPoint, worldPoint);

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
}

export function applyWeightForce(
  pilotBody: CANNON.Body,
  vectorVisualizer: VectorVisualizater
): void {
  const weightVector = new CANNON.Vec3(0, -9.82 * pilotBody.mass, 0);
  pilotBody.applyForce(weightVector);

  if (!weightVector.isZero()) {
    vectorVisualizer.addForce({
      name: "WEIGHT",
      color: 0xffff00, // Yellow
      position: new THREE.Vector3(
        pilotBody.position.x,
        pilotBody.position.y,
        pilotBody.position.z
      ),
      vector: weightVector,
      scale: 0.01 * 0.2,
    });
  }
}

export function applyForcesAndDrawVectors(params: ForceApplicationParams): void {
  const { gliderBody, pilotBody, vectorVisualizer, leftBreakForce, rightBreakForce } = params;

  // Calculate lift scale based on glider's angle of attack
  const velocity = gliderBody.velocity;
  const speed = velocity.length();
  let liftScale = 12;

  if (speed > 0.001) {
    // Get the glider's up vector in world space
    const gliderUp = gliderBody.vectorToWorldFrame(new CANNON.Vec3(0, 1, 0));
    // Normalize velocity for direction
    const normalizedVelocity = velocity.clone();
    normalizedVelocity.normalize();
    // Calculate angle between velocity and glider's up vector
    const angle = Math.acos(gliderUp.dot(normalizedVelocity));
    // Scale lift based on angle of attack (maximum at 45 degrees)
    liftScale = Math.sin(2 * angle); // This gives maximum lift at 45 degrees
  }

  applyLiftForce(gliderBody, pilotBody, vectorVisualizer, liftScale);
  // applyDragForce(gliderBody, pilotBody, vectorVisualizer);
  // applyBreakForces(gliderBody, pilotBody, vectorVisualizer, leftBreakForce, rightBreakForce);
  // applyWeightForce(pilotBody, vectorVisualizer);
} 