import * as THREE from 'three';
import { WindCondition } from './types';

// Create a wind arrow to visualize wind direction
export const createWindArrow = (
  position: THREE.Vector3,
  direction: number, // Direction in degrees (0-360)
  speed: number,     // Wind speed
  color: number = 0xffffff
): THREE.Object3D => {
  // Create a group to hold the arrow
  const group = new THREE.Group();

  // Create the arrow shaft with improved geometry
  const shaftGeometry = new THREE.CylinderGeometry(3, 6, 120, 12);
  const shaftMaterial = new THREE.MeshLambertMaterial({
    color,
    transparent: true,
    opacity: 0.9
  });
  const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
  shaft.rotation.x = Math.PI / 2; // Rotate to point forward

  // Create the arrow head with better proportions
  const headGeometry = new THREE.ConeGeometry(18, 40, 12);
  const headMaterial = new THREE.MeshLambertMaterial({
    color: color,
    transparent: true,
    opacity: 0.95
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 80; // Position at the end of the shaft
  head.rotation.x = Math.PI / 2; // Rotate to point forward

  // Add glowing effect with emissive material
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.3
  });

  // Create glow effect around the head
  const glowGeometry = new THREE.ConeGeometry(22, 44, 12);
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.y = 80;
  glow.rotation.x = Math.PI / 2;

  // Add shaft and head to the group
  group.add(glow); // Add glow first (behind)
  group.add(shaft);
  group.add(head);

  // Position the group
  group.position.copy(position);

  // Rotate the group to point in the wind direction
  // Convert degrees to radians and adjust for THREE.js coordinate system
  const radians = (direction - 180) * (Math.PI / 180);
  group.rotation.y = radians;

  // Scale the arrow based on wind speed with better scaling
  const scale = Math.min(1.2, Math.max(0.6, speed / 15)); // Scale between 0.6 and 1.2 based on speed
  group.scale.set(scale, scale, scale);

  // Add metadata
  group.userData['windDirection'] = direction;
  group.userData['windSpeed'] = speed;

  return group;
};

// Create wind arrows for a takeoff based on its conditions
export const createWindArrowsForTakeoff = (
  takeoffPosition: THREE.Vector3,
  conditions: WindCondition[]
): THREE.Object3D[] => {
  const arrows: THREE.Object3D[] = [];
  
  // Find the best condition (highest rating)
  const bestCondition = conditions.length > 0 ? conditions.reduce((best, current) =>
    current.rating > best.rating ? current : best, conditions[0]!) : null;
  
  if (bestCondition) {
    // Create an arrow for the ideal direction with vibrant green
    const idealDirection = bestCondition.direction.ideal;
    const idealSpeed = bestCondition.speed.ideal;

    // Position the arrow slightly above the takeoff
    const arrowPosition = takeoffPosition.clone();
    arrowPosition.y += 70;

    const arrow = createWindArrow(arrowPosition, idealDirection, idealSpeed, 0x00ff88);
    arrows.push(arrow);

    // Create arrows for the range limits with better spacing and colors
    const [minDir, maxDir] = bestCondition.direction.range;

    // Min direction arrow (orange - caution)
    const minArrowPos = takeoffPosition.clone();
    minArrowPos.y += 55;
    minArrowPos.x -= 50;
    minArrowPos.z -= 20;
    const minArrow = createWindArrow(minArrowPos, minDir, idealSpeed * 0.8, 0xff9500);
    arrows.push(minArrow);

    // Max direction arrow (orange - caution)
    const maxArrowPos = takeoffPosition.clone();
    maxArrowPos.y += 55;
    maxArrowPos.x += 50;
    maxArrowPos.z += 20;
    const maxArrow = createWindArrow(maxArrowPos, maxDir, idealSpeed * 0.8, 0xff9500);
    arrows.push(maxArrow);
  }
  
  return arrows;
}; 