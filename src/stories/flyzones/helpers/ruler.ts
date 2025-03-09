import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { worldToGPS } from './gps';

interface RulerOptions {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  labelRenderer: CSS2DRenderer;
}

export interface Ruler {
  activate: () => void;
  deactivate: () => void;
  isActive: () => boolean;
}

export const createRuler = (options: RulerOptions): Ruler => {
  const { scene, camera, renderer, labelRenderer } = options;
  
  let active = false;
  let startPoint: THREE.Vector3 | null = null;
  let endPoint: THREE.Vector3 | null = null;
  let rulerLine: THREE.Line | null = null;
  let distanceLabel: CSS2DObject | null = null;
  
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  const onMouseClick = (event: MouseEvent) => {
    if (!active) return;
    
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Find intersections with the terrain
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      
      if (!startPoint) {
        // First click - set start point
        startPoint = point.clone();
        
        // Create a visual marker for the start point
        const markerGeometry = new THREE.SphereGeometry(50, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(startPoint);
        marker.userData.isRulerMarker = true;
        scene.add(marker);
        
      } else if (!endPoint) {
        // Second click - set end point and draw line
        endPoint = point.clone();
        
        // Create a visual marker for the end point
        const markerGeometry = new THREE.SphereGeometry(50, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(endPoint);
        marker.userData.isRulerMarker = true;
        scene.add(marker);
        
        // Create line between points
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        rulerLine = new THREE.Line(lineGeometry, lineMaterial);
        rulerLine.userData.isRulerLine = true;
        scene.add(rulerLine);
        
        // Calculate distance
        const distance = startPoint.distanceTo(endPoint);
        
        // Create distance label
        const labelDiv = document.createElement('div');
        labelDiv.className = 'ruler-label';
        labelDiv.textContent = `Distance: ${distance.toFixed(1)}m`;
        
        distanceLabel = new CSS2DObject(labelDiv);
        distanceLabel.position.copy(endPoint);
        distanceLabel.position.y += 100; // Offset above the end point
        distanceLabel.userData.isRulerLabel = true;
        scene.add(distanceLabel);
        
        // Log the measurement
        const startGPS = worldToGPS(startPoint);
        const endGPS = worldToGPS(endPoint);
        
        console.log('Ruler Measurement:');
        console.log('Start:', {
          world: startPoint,
          gps: startGPS
        });
        console.log('End:', {
          world: endPoint,
          gps: endGPS
        });
        console.log('Distance:', distance.toFixed(1), 'meters');
        
        // Reset for next measurement
        startPoint = null;
        endPoint = null;
      }
    }
  };
  
  const activate = () => {
    active = true;
    renderer.domElement.addEventListener('click', onMouseClick);
    
    // Change cursor to indicate ruler mode
    renderer.domElement.style.cursor = 'crosshair';
  };
  
  const deactivate = () => {
    active = false;
    renderer.domElement.removeEventListener('click', onMouseClick);
    
    // Reset cursor
    renderer.domElement.style.cursor = 'auto';
    
    // Clear any existing ruler elements
    startPoint = null;
    endPoint = null;
    
    // Remove ruler objects from scene
    scene.children.forEach(child => {
      if (
        child.userData.isRulerMarker || 
        child.userData.isRulerLine || 
        child.userData.isRulerLabel
      ) {
        scene.remove(child);
      }
    });
  };
  
  const isActive = () => active;
  
  return {
    activate,
    deactivate,
    isActive
  };
}; 