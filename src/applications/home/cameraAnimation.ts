import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  OrbitControlsHelper,
  ORBIT_CONTROLS_PRESETS,
} from '../../foundation/utils/OrbitControlsHelper';
import { animator } from '../../foundation/systems/animation/SimpleAnimator';

export interface CameraAnimationConfig {
  targetPosition: THREE.Vector3;
  animationDurationMs: number;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}

/**
 * Sets up and executes a dramatic two-phase camera animation
 */
export function setupCameraAnimation(
  camera: THREE.Camera,
  controls: OrbitControls,
  config: CameraAnimationConfig
): { isAnimating: boolean } {
  const state = { isAnimating: false };
  const pgPos = config.targetPosition.clone();

  // Starting position - extremely far away on the other side of the island
  const initialCameraPosition = new THREE.Vector3(-2000, 2200, 5000);

  // Intermediate position - approaching the area quickly
  const intermediatePosition = new THREE.Vector3(4500, 1800, 1500);

  // Final position - slow, careful approach to the target
  const finalCameraPosition = new THREE.Vector3(
    pgPos.x - 100,
    pgPos.y + 50,
    pgPos.z + 200
  );

  // Set initial camera position and look at the target
  camera.position.copy(initialCameraPosition);
  camera.lookAt(pgPos);

  // Ensure controls are set up properly
  if (controls) {
    controls.target.copy(pgPos);
    controls.update();
    controls.enabled = false; // Disable controls during animation
  }

  // Start the dramatic two-phase camera animation
  setTimeout(() => {
    const startTarget = controls ? controls.target.clone() : pgPos.clone();

    if (config.onAnimationStart) {
      config.onAnimationStart();
    }

    state.isAnimating = true;
    animator.animate(
      'camera-seamless',
      config.animationDurationMs,
      (progress) => {
        let currentPosition;

        if (progress < 0.35) {
          // Phase 1: Fast approach (first 35% of total duration)
          const phase1Progress = progress / 0.35;
          const easedProgress =
            phase1Progress < 0.5
              ? 4 * phase1Progress * phase1Progress * phase1Progress
              : 1 - Math.pow(-2 * phase1Progress + 2, 3) / 2;

          currentPosition = new THREE.Vector3().lerpVectors(
            initialCameraPosition,
            intermediatePosition,
            easedProgress
          );

          const lookTarget = new THREE.Vector3().lerpVectors(
            startTarget,
            pgPos,
            easedProgress * 0.5
          );
          if (controls) {
            controls.target.copy(lookTarget);
            controls.update();
          }
        } else {
          // Phase 2: Slow approach (last 65%)
          const phase2Progress = (progress - 0.35) / 0.65;
          const easedProgress = 1 - Math.pow(1 - phase2Progress, 4);

          currentPosition = new THREE.Vector3().lerpVectors(
            intermediatePosition,
            finalCameraPosition,
            easedProgress
          );

          if (controls) {
            const smoothFactor = 0.03 * (1 - Math.pow(1 - phase2Progress, 2));
            controls.target.lerpVectors(controls.target, pgPos, smoothFactor);
            controls.update();
          }
        }

        camera.position.copy(currentPosition);
      },
      () => {
        // Animation complete
        if (controls) {
          // Ensure target is exactly at pgPos (animation might not have fully reached it)
          controls.target.copy(pgPos);
          controls.update();

          controls.enabled = true;

          // Apply limits without changing target position
          const limits = OrbitControlsHelper.createCenteredLimits(pgPos, {
            ...ORBIT_CONTROLS_PRESETS['closeSubject'],
            minDistance: 50,
            maxDistance: 1500,
            panBoundary: {
              center: pgPos,
              radius: 500,
              verticalScale: 0.5,
            },
          });
          OrbitControlsHelper.applyLimits(controls, limits);
        }

        state.isAnimating = false;

        if (config.onAnimationComplete) {
          config.onAnimationComplete();
        }
      }
    );
  }, 100);

  return state;
}

/**
 * Applies gentle floating motion to the camera (cloud-like movement)
 */
export function applyFloatingMotion(
  camera: THREE.Camera,
  startTime: number,
  isAnimating: boolean
): void {
  if (isAnimating) {
    return;
  }

  const time = (Date.now() - startTime) * 0.0005;
  const floatAmplitude = 2;
  const floatSpeed = 1.2;

  const floatY = Math.sin(time * floatSpeed) * floatAmplitude;
  const floatX = Math.sin(time * floatSpeed * 0.7) * (floatAmplitude * 0.3);
  const floatZ = Math.cos(time * floatSpeed * 0.5) * (floatAmplitude * 0.2);

  camera.position.y += floatY * 0.02;
  camera.position.x += floatX * 0.01;
  camera.position.z += floatZ * 0.01;
}
