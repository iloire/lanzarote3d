import * as THREE from 'three';

/**
 * Utility functions for safely disposing Three.js objects and preventing memory leaks
 */

/**
 * Recursively dispose of Three.js objects and their resources
 * @param obj The Object3D to dispose
 */
export function disposeObject3D(obj: THREE.Object3D): void {
  // Recursively dispose children first
  obj.children.forEach(child => {
    disposeObject3D(child);
  });

  // Dispose of mesh-specific resources
  if (obj instanceof THREE.Mesh) {
    // Dispose geometry
    if (obj.geometry) {
      obj.geometry.dispose();
    }

    // Dispose materials
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(material => {
          disposeMaterial(material);
        });
      } else {
        disposeMaterial(obj.material);
      }
    }
  }

  // Clear any user data or custom properties
  obj.userData = {};
}

/**
 * Safely dispose of Three.js materials and their textures
 * @param material The material to dispose
 */
export function disposeMaterial(material: THREE.Material): void {
  // Dispose of textures and other disposable properties
  Object.values(material).forEach(value => {
    if (value && typeof value === 'object' && 'dispose' in value && typeof (value as { dispose: () => void }).dispose === 'function') {
      try {
        (value as { dispose: () => void }).dispose();
      } catch (error) {
        console.warn('Error disposing material property:', error);
      }
    }
  });

  // Dispose the material itself
  try {
    material.dispose();
  } catch (error) {
    console.warn('Error disposing material:', error);
  }
}

/**
 * Dispose of an array of Object3D instances
 * @param objects Array of objects to dispose
 * @param scene Optional scene to remove objects from
 */
export function disposeObjects(objects: THREE.Object3D[], scene?: THREE.Scene): void {
  objects.forEach(obj => {
    if (scene) {
      scene.remove(obj);
    }
    disposeObject3D(obj);
  });
}