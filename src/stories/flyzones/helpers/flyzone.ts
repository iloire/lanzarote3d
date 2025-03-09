import * as THREE from 'three';
import { FlyZoneShape } from '../locations';
import { FLYZONE_COLORS } from '../config/flyzone-config';
import { WIND_ARROW } from '../config/wind-config';
import { getConfig } from '../config';

export const createCustomFlyZone = (shape: FlyZoneShape) => {
  const group = new THREE.Group();
  const config = getConfig();
  
  // Create boxes for each phase
  const phases = Object.keys(shape.phases).map(key => ({
    id: key,
    ...shape.phases[key]
  }));
  
  phases.forEach((phase) => {
    // Create box geometry
    const boxGeometry = new THREE.BoxGeometry(
      phase.dimensions.width,
      phase.dimensions.height,
      phase.dimensions.length
    );
    
    // Create material with transparency and color based on phase type
    const color = new THREE.Color();
    switch (phase.type) {
      case 'takeoff':
        color.setHex(FLYZONE_COLORS.danger);
        break;
      case 'landing':
        color.setHex(FLYZONE_COLORS.caution);
        break;
      case 'ridge':
        color.setHex(FLYZONE_COLORS.safe);
        break;
      default:
        color.setHex(shape.color || FLYZONE_COLORS.safe);
    }
    
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2,
      wireframe: false
    });
    
    // Create box mesh
    const box = new THREE.Mesh(boxGeometry, material);
    box.position.copy(phase.position);
    
    // Add wireframe
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeometry),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
      })
    );
    box.add(wireframe);
    
    // Add height indicator line
    const lineMaterial = new THREE.LineDashedMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
      dashSize: 50,
      gapSize: 50,
    });

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(phase.position.x, 0, phase.position.z),
      phase.position
    ]);

    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances();
    group.add(line);
    
    // Add connecting lines to next phases
    if (phase.nextPhases) {
      phase.nextPhases.forEach(nextPhaseId => {
        const nextPhase = shape.phases[nextPhaseId];
        if (nextPhase) {
          const connectionGeometry = new THREE.BufferGeometry().setFromPoints([
            phase.position,
            nextPhase.position
          ]);
          
          const connectionLine = new THREE.Line(
            connectionGeometry,
            new THREE.LineBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.3
            })
          );
          group.add(connectionLine);
        }
      });
    }
    
    group.add(box);
  });
  
  return group;
};

export const createWindArrow = (windDirection: number) => {
  // Create arrow body (cylinder)
  const bodyGeometry = new THREE.CylinderGeometry(
    WIND_ARROW.radius/3, 
    WIND_ARROW.radius/3, 
    WIND_ARROW.height * WIND_ARROW.bodyRatio, 
    8
  );
  
  const bodyMaterial = new THREE.MeshPhongMaterial({ 
    color: WIND_ARROW.color,
    transparent: true,
    opacity: WIND_ARROW.opacity 
  });
  
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  
  // Create arrow head (cone)
  const headGeometry = new THREE.ConeGeometry(
    WIND_ARROW.radius, 
    WIND_ARROW.height * WIND_ARROW.headRatio, 
    8
  );
  
  const headMaterial = new THREE.MeshPhongMaterial({ 
    color: WIND_ARROW.color,
    transparent: true,
    opacity: WIND_ARROW.opacity 
  });
  
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = WIND_ARROW.height * WIND_ARROW.bodyRatio / 2;
  
  // Create arrow group
  const arrow = new THREE.Group();
  arrow.add(body);
  arrow.add(head);
  
  // First rotate arrow to horizontal position
  arrow.rotation.z = Math.PI / 2;
  
  // Then rotate to point into wind direction
  // Add 180° because we want arrow to point where wind is coming from
  arrow.rotation.y = THREE.MathUtils.degToRad(windDirection + 180);
  
  return arrow;
}; 