import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Extended OrbitControls interface with custom pan limit properties
interface ExtendedOrbitControls extends OrbitControls {
  minPan?: THREE.Vector3;
  maxPan?: THREE.Vector3;
}

export interface OrbitControlsLimits {
  // Distance limits
  minDistance?: number;
  maxDistance?: number;

  // Angle limits (in radians)
  minPolarAngle?: number;
  maxPolarAngle?: number;
  minAzimuthAngle?: number;
  maxAzimuthAngle?: number;

  // Pan limits (world coordinates)
  panBoundary?: {
    center: THREE.Vector3;
    radius: number;
    verticalScale?: number; // Scale factor for vertical pan limits
  };

  // Speed controls (0-1 scale, where 1 is normal speed)
  rotateSpeed?: number;
  zoomSpeed?: number;
  panSpeed?: number;

  // Damping settings
  enableDamping?: boolean;
  dampingFactor?: number;

  // Auto-rotate settings
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

export interface OrbitControlsPresets {
  [key: string]: OrbitControlsLimits;
}

// Predefined control presets for common scenarios
export const ORBIT_CONTROLS_PRESETS: OrbitControlsPresets = {
  // Tight limits around a subject (like paraglider in animation)
  closeSubject: {
    minDistance: 50,
    maxDistance: 1000,
    minPolarAngle: Math.PI * 0.1, // 18 degrees from top
    maxPolarAngle: Math.PI * 0.85, // 153 degrees from top
    panBoundary: {
      center: new THREE.Vector3(0, 0, 0),
      radius: 300,
      verticalScale: 0.5,
    },
    rotateSpeed: 0.3,
    zoomSpeed: 0.5,
    panSpeed: 0.4,
    enableDamping: true,
    dampingFactor: 0.1,
    autoRotate: false,
  },

  // Medium exploration limits (for terrain/landscape viewing)
  landscape: {
    minDistance: 100,
    maxDistance: 5000,
    minPolarAngle: Math.PI * 0.05, // 9 degrees from top
    maxPolarAngle: Math.PI * 0.9, // 162 degrees from top
    panBoundary: {
      center: new THREE.Vector3(0, 0, 0),
      radius: 2000,
      verticalScale: 0.3,
    },
    rotateSpeed: 0.5,
    zoomSpeed: 0.7,
    panSpeed: 0.6,
    enableDamping: true,
    dampingFactor: 0.05,
    autoRotate: false,
  },

  // Wide exploration (for large scenes)
  freeExploration: {
    minDistance: 10,
    maxDistance: 50000,
    minPolarAngle: Math.PI * 0.01, // 1.8 degrees from top
    maxPolarAngle: Math.PI * 0.99, // 178 degrees from top
    panBoundary: {
      center: new THREE.Vector3(0, 0, 0),
      radius: 10000,
      verticalScale: 1.0,
    },
    rotateSpeed: 0.8,
    zoomSpeed: 1.0,
    panSpeed: 0.8,
    enableDamping: true,
    dampingFactor: 0.03,
    autoRotate: false,
  },

  // Cinematic mode (slow, smooth movements)
  cinematic: {
    minDistance: 20,
    maxDistance: 2000,
    minPolarAngle: Math.PI * 0.05,
    maxPolarAngle: Math.PI * 0.95,
    rotateSpeed: 0.2,
    zoomSpeed: 0.3,
    panSpeed: 0.2,
    enableDamping: true,
    dampingFactor: 0.15,
    autoRotate: true,
    autoRotateSpeed: 0.3,
  },

  // No limits (unrestricted)
  unlimited: {
    rotateSpeed: 1.0,
    zoomSpeed: 1.0,
    panSpeed: 1.0,
    enableDamping: false,
    autoRotate: false,
  },
};

export class OrbitControlsHelper {
  /**
   * Apply limits and settings to orbit controls
   */
  static applyLimits(controls: ExtendedOrbitControls, limits: OrbitControlsLimits): void {
    if (!controls) {
      console.warn('OrbitControlsHelper: No controls provided');
      return;
    }

    // Distance limits
    if (limits.minDistance !== undefined) {
      controls.minDistance = limits.minDistance;
    }
    if (limits.maxDistance !== undefined) {
      controls.maxDistance = limits.maxDistance;
    }

    // Angle limits
    if (limits.minPolarAngle !== undefined) {
      controls.minPolarAngle = limits.minPolarAngle;
    }
    if (limits.maxPolarAngle !== undefined) {
      controls.maxPolarAngle = limits.maxPolarAngle;
    }
    if (limits.minAzimuthAngle !== undefined) {
      controls.minAzimuthAngle = limits.minAzimuthAngle;
    }
    if (limits.maxAzimuthAngle !== undefined) {
      controls.maxAzimuthAngle = limits.maxAzimuthAngle;
    }

    // Pan limits
    if (limits.panBoundary) {
      const { center, radius, verticalScale = 1.0 } = limits.panBoundary;
      const verticalRadius = radius * verticalScale;

      controls.minPan = new THREE.Vector3(
        center.x - radius,
        center.y - verticalRadius,
        center.z - radius
      );
      controls.maxPan = new THREE.Vector3(
        center.x + radius,
        center.y + verticalRadius,
        center.z + radius
      );
      controls.enablePan = true;
    }

    // Speed controls
    if (limits.rotateSpeed !== undefined) {
      controls.rotateSpeed = limits.rotateSpeed;
    }
    if (limits.zoomSpeed !== undefined) {
      controls.zoomSpeed = limits.zoomSpeed;
    }
    if (limits.panSpeed !== undefined) {
      controls.panSpeed = limits.panSpeed;
    }

    // Damping settings
    if (limits.enableDamping !== undefined) {
      controls.enableDamping = limits.enableDamping;
    }
    if (limits.dampingFactor !== undefined) {
      controls.dampingFactor = limits.dampingFactor;
    }

    // Auto-rotate settings
    if (limits.autoRotate !== undefined) {
      controls.autoRotate = limits.autoRotate;
    }
    if (limits.autoRotateSpeed !== undefined) {
      controls.autoRotateSpeed = limits.autoRotateSpeed;
    }

    console.log('🎮 Orbit controls limits applied:', limits);
  }

  /**
   * Apply a preset configuration to orbit controls
   */
  static applyPreset(controls: ExtendedOrbitControls, presetName: keyof typeof ORBIT_CONTROLS_PRESETS): void {
    const preset = ORBIT_CONTROLS_PRESETS[presetName];
    if (!preset) {
      console.warn(`OrbitControlsHelper: Preset '${presetName}' not found`);
      return;
    }

    this.applyLimits(controls, preset);
    console.log(`🎮 Applied orbit controls preset: ${presetName}`);
  }

  /**
   * Create custom limits centered around a specific position
   */
  static createCenteredLimits(
    center: THREE.Vector3,
    preset?: OrbitControlsLimits
  ): OrbitControlsLimits {
    const basePreset = preset ?? ORBIT_CONTROLS_PRESETS['closeSubject'];
    const limits = { ...basePreset };

    if (limits.panBoundary) {
      limits.panBoundary = {
        ...limits.panBoundary,
        center: center.clone(),
      };
    }

    return limits;
  }

  /**
   * Update controls target and apply limits around new target
   */
  static focusOnTarget(controls: ExtendedOrbitControls, target: THREE.Vector3, limits?: OrbitControlsLimits): void {
    if (!controls) return;

    // Update target
    controls.target.copy(target);
    controls.update();

    // Apply limits if provided
    if (limits) {
      const centeredLimits = this.createCenteredLimits(target, limits);
      this.applyLimits(controls, centeredLimits);
    }

    console.log(`🎯 Orbit controls focused on target:`, target);
  }

  /**
   * Smoothly transition controls to new limits over time
   * Note: This is a basic implementation - could be enhanced with proper tweening
   */
  static transitionToLimits(
    controls: ExtendedOrbitControls,
    newLimits: OrbitControlsLimits,
    duration: number = 1000
  ): Promise<void> {
    return new Promise(resolve => {
      // For now, just apply immediately
      // TODO: Implement smooth transitions using tweening
      this.applyLimits(controls, newLimits);
      setTimeout(resolve, duration);
    });
  }

  /**
   * Check if controls need update (for damping)
   */
  static needsUpdate(controls: OrbitControls): boolean {
    return controls && controls.enableDamping;
  }

  /**
   * Update controls (should be called in animation loop if damping is enabled)
   */
  static update(controls: OrbitControls): void {
    if (controls && controls.enableDamping) {
      controls.update();
    }
  }
}

export default OrbitControlsHelper;
