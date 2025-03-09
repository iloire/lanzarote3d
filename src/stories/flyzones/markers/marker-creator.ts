import * as THREE from 'three';
import { MarkerObject } from './markers';

interface SimpleMarkerOptions {
  position: THREE.Vector3;
  color?: number;
  size?: number;
  opacity?: number;
}

export const createSimpleMarker = async (
  options: SimpleMarkerOptions,
  scene: THREE.Scene
): Promise<MarkerObject> => {
  const { position, color = 0xffffff, size = 100, opacity = 1.0 } = options;
  
  // Create a simple sphere geometry
  const geometry = new THREE.SphereGeometry(size, 16, 16);
  const material = new THREE.MeshBasicMaterial({ 
    color, 
    opacity, 
    transparent: opacity < 1.0 
  });
  
  // Create the mesh
  const mesh = new THREE.Mesh(geometry, material) as MarkerObject;
  mesh.position.copy(position);
  
  // Add marker metadata
  mesh.userData.isMarker = true;
  
  return mesh;
}; 