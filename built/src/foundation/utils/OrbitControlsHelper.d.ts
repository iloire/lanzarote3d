import * as THREE from 'three';
export interface OrbitControlsLimits {
    minDistance?: number;
    maxDistance?: number;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    minAzimuthAngle?: number;
    maxAzimuthAngle?: number;
    panBoundary?: {
        center: THREE.Vector3;
        radius: number;
        verticalScale?: number;
    };
    rotateSpeed?: number;
    zoomSpeed?: number;
    panSpeed?: number;
    enableDamping?: boolean;
    dampingFactor?: number;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
}
export interface OrbitControlsPresets {
    [key: string]: OrbitControlsLimits;
}
export declare const ORBIT_CONTROLS_PRESETS: OrbitControlsPresets;
export declare class OrbitControlsHelper {
    /**
     * Apply limits and settings to orbit controls
     */
    static applyLimits(controls: any, limits: OrbitControlsLimits): void;
    /**
     * Apply a preset configuration to orbit controls
     */
    static applyPreset(controls: any, presetName: keyof typeof ORBIT_CONTROLS_PRESETS): void;
    /**
     * Create custom limits centered around a specific position
     */
    static createCenteredLimits(center: THREE.Vector3, preset?: OrbitControlsLimits): OrbitControlsLimits;
    /**
     * Update controls target and apply limits around new target
     */
    static focusOnTarget(controls: any, target: THREE.Vector3, limits?: OrbitControlsLimits): void;
    /**
     * Smoothly transition controls to new limits over time
     * Note: This is a basic implementation - could be enhanced with proper tweening
     */
    static transitionToLimits(controls: any, newLimits: OrbitControlsLimits, duration?: number): Promise<void>;
    /**
     * Check if controls need update (for damping)
     */
    static needsUpdate(controls: any): boolean;
    /**
     * Update controls (should be called in animation loop if damping is enabled)
     */
    static update(controls: any): void;
}
export default OrbitControlsHelper;
//# sourceMappingURL=OrbitControlsHelper.d.ts.map