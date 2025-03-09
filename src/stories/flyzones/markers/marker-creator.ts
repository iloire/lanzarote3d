import * as THREE from 'three';
import { MarkerObject } from './markers';

interface SimpleMarkerOptions {
  position: THREE.Vector3;
  color?: number;
  size?: number;
  opacity?: number;
}

export const createSimpleMarker = async (
  options: {
    position: THREE.Vector3;
    color: number;
    size: number;
    opacity?: number;
  },
  scene: THREE.Scene
): Promise<THREE.Object3D> => {
  // Create a simple sphere
  const geometry = new THREE.SphereGeometry(options.size, 16, 16);
  const material = new THREE.MeshBasicMaterial({
    color: options.color,
    transparent: true,
    opacity: options.opacity || 1
  });
  
  // Create the mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(options.position);
  
  // Add marker metadata
  mesh.userData.isMarker = true;
  mesh.userData.markerType = 'location';
  
  return mesh;
}; 