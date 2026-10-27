import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  OrbitControlsHelper,
  ORBIT_CONTROLS_PRESETS,
} from '../../foundation/utils/OrbitControlsHelper';
import { animator, Easing } from '../../foundation/systems/animation/SimpleAnimator';

export interface CameraAnimationConfig {
  /** The lead pilot; it is flying, so the camera aims at where it is now, every frame */
  target: THREE.Object3D;
  animationDurationMs: number;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}

/**
 * Flies the camera in from across the island to the lead pilot, ending at the same offset
 * from it however far it has flown meanwhile
 */
export function setupCameraAnimation(
  camera: THREE.Camera,
  controls: OrbitControls,
  config: CameraAnimationConfig
): { isAnimating: boolean } {
  const state = { isAnimating: false };
  const pgPos = config.target.position.clone();
  const drift = new THREE.Vector3();

  // Starting position - extremely far away on the other side of the island
  const initialCameraPosition = new THREE.Vector3(-2000, 2200, 5000);

  // Intermediate position - approaching the area quickly
  const intermediatePosition = new THREE.Vector3(4500, 1800, 1500);

  // Final position - slow, careful approach to the target
  const finalCameraPosition = new THREE.Vector3(pgPos.x - 100, pgPos.y + 50, pgPos.z + 200);

  // Set initial camera position and look at the target
  camera.position.copy(initialCameraPosition);
  camera.lookAt(pgPos);

  // Ensure controls are set up properly
  if (controls) {
    controls.target.copy(pgPos);
    controls.update();
    controls.enabled = false; // Disable controls during animation
  }

  // One continuous move along a spline through all three points. The old two-phase
  // lerp stopped dead at the intermediate point; this one never changes speed abruptly.
  const path = new THREE.CatmullRomCurve3(
    [initialCameraPosition, intermediatePosition, finalCameraPosition],
    false,
    'centripetal'
  );

  setTimeout(() => {
    if (config.onAnimationStart) {
      config.onAnimationStart();
    }

    state.isAnimating = true;
    animator.animate(
      'camera-seamless',
      config.animationDurationMs,
      progress => {
        drift.subVectors(config.target.position, pgPos).multiplyScalar(progress);
        camera.position.copy(path.getPointAt(progress)).add(drift);
        if (controls) {
          controls.target.copy(config.target.position);
          controls.update();
        }
      },
      () => {
        // Animation complete
        if (controls) {
          // Ensure target is exactly on the pilot (animation might not have fully reached it)
          controls.target.copy(config.target.position);
          controls.update();

          controls.enabled = true;

          // Apply limits without changing target position
          const limits = OrbitControlsHelper.createCenteredLimits(config.target.position, {
            ...ORBIT_CONTROLS_PRESETS['closeSubject'],
            minDistance: 50,
            maxDistance: 3000,
            panBoundary: {
              center: config.target.position.clone(),
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
      },
      Easing.approach
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
