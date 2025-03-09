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
  
  // Create the arrow shaft
  const shaftGeometry = new THREE.CylinderGeometry(5, 5, 100, 8);
  const shaftMaterial = new THREE.MeshBasicMaterial({ color });
  const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
  shaft.rotation.x = Math.PI / 2; // Rotate to point forward
  
  // Create the arrow head
  const headGeometry = new THREE.ConeGeometry(15, 30, 8);
  const headMaterial = new THREE.MeshBasicMaterial({ color });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 65; // Position at the end of the shaft
  head.rotation.x = Math.PI / 2; // Rotate to point forward
  
  // Add shaft and head to the group
  group.add(shaft);
  group.add(head);
  
  // Position the group
  group.position.copy(position);
  
  // Rotate the group to point in the wind direction
  // Convert degrees to radians and adjust for THREE.js coordinate system
  const radians = (direction - 180) * (Math.PI / 180);
  group.rotation.y = radians;
  
  // Scale the arrow based on wind speed
  const scale = Math.min(1, Math.max(0.5, speed / 20)); // Scale between 0.5 and 1 based on speed
  group.scale.set(scale, scale, scale);
  
  // Add metadata
  group.userData.windDirection = direction;
  group.userData.windSpeed = speed;
  
  return group;
};

// Create wind arrows for a takeoff based on its conditions
export const createWindArrowsForTakeoff = (
  takeoffPosition: THREE.Vector3,
  conditions: WindCondition[]
): THREE.Object3D[] => {
  const arrows: THREE.Object3D[] = [];
  
  // Find the best condition (highest rating)
  const bestCondition = conditions.reduce((best, current) => 
    current.rating > best.rating ? current : best, conditions[0]);
  
  if (bestCondition) {
    // Create an arrow for the ideal direction
    const idealDirection = bestCondition.direction.ideal;
    const idealSpeed = bestCondition.speed.ideal;
    
    // Position the arrow slightly above the takeoff
    const arrowPosition = takeoffPosition.clone();
    arrowPosition.y += 50;
    
    const arrow = createWindArrow(arrowPosition, idealDirection, idealSpeed, 0x00ff00);
    arrows.push(arrow);
    
    // Optionally, create arrows for the range limits
    const [minDir, maxDir] = bestCondition.direction.range;
    
    // Min direction arrow (red)
    const minArrowPos = takeoffPosition.clone();
    minArrowPos.y += 50;
    minArrowPos.x -= 30;
    const minArrow = createWindArrow(minArrowPos, minDir, idealSpeed, 0xff0000);
    arrows.push(minArrow);
    
    // Max direction arrow (red)
    const maxArrowPos = takeoffPosition.clone();
    maxArrowPos.y += 50;
    maxArrowPos.x += 30;
    const maxArrow = createWindArrow(maxArrowPos, maxDir, idealSpeed, 0xff0000);
    arrows.push(maxArrow);
  }
  
  return arrows;
}; 