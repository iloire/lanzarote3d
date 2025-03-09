import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// Convert 3D world coordinates to 2D screen coordinates
export const worldToScreen = (
  position: THREE.Vector3,
  camera: THREE.Camera,
  renderer: CSS2DRenderer | THREE.WebGLRenderer
): { x: number, y: number } => {
  // Clone the position to avoid modifying the original
  const pos = position.clone();
  
  // Project the 3D position to 2D screen space
  pos.project(camera);
  
  // Convert to screen coordinates
  const canvas = renderer.domElement;
  const widthHalf = (canvas instanceof HTMLCanvasElement ? canvas.width : window.innerWidth) / 2;
  const heightHalf = (canvas instanceof HTMLCanvasElement ? canvas.height : window.innerHeight) / 2;
  
  const x = (pos.x * widthHalf) + widthHalf;
  const y = -(pos.y * heightHalf) + heightHalf;
  
  return { x, y };
}; 