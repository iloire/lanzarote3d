import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  OrbitControlsHelper,
  ORBIT_CONTROLS_PRESETS,
} from '../../foundation/utils/OrbitControlsHelper';
import { animator } from '../../foundation/systems/animation/SimpleAnimator';
import { ANIMATION_CONFIG } from './config';

export interface CameraAnimationCallbacks {
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
}

/**
 * Sets up camera for static mode (no animation)
 */
export function setupStaticCamera(
  camera: THREE.Camera,
  controls: OrbitControls | null,
  boatCenterPosition: THREE.Vector3
): void {
  let cameraPos, lookAtPos;

  if (ANIMATION_CONFIG.staticMode.position === 'custom') {
    // Use custom positioning
    cameraPos = ANIMATION_CONFIG.staticMode.customPosition;
    lookAtPos = ANIMATION_CONFIG.staticMode.customLookAt;
  } else {
    // Use preset static position
    const staticPos = ANIMATION_CONFIG.positions.static[ANIMATION_CONFIG.staticMode.position];
    cameraPos = staticPos;
    lookAtPos = boatCenterPosition;
  }

  camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
  camera.lookAt(lookAtPos.x, lookAtPos.y, lookAtPos.z);

  if (controls) {
    controls.target.set(lookAtPos.x, lookAtPos.y, lookAtPos.z);
    controls.update();
    controls.enabled = ANIMATION_CONFIG.staticMode.enableControls;
  }
}

/**
 * Sets up and executes a three-phase camera animation (boats → transition → paraglider)
 */
export function setupAnimatedCamera(
  camera: THREE.Camera,
  controls: OrbitControls | null,
  paragliderPosition: THREE.Vector3,
  callbacks: CameraAnimationCallbacks = {}
): { cleanup: () => void } {
  const { positions } = ANIMATION_CONFIG;

  const initialCameraPosition = new THREE.Vector3(
    positions.initial.x,
    positions.initial.y,
    positions.initial.z
  );

  const boatCenterPosition = new THREE.Vector3(
    positions.boatCenter.x,
    positions.boatCenter.y,
    positions.boatCenter.z
  );

  const intermediatePosition = new THREE.Vector3(
    positions.intermediate.x,
    positions.intermediate.y,
    positions.intermediate.z
  );

  // Final position calculated from paraglider position + offset
  const finalCameraPosition = new THREE.Vector3(
    paragliderPosition.x + positions.finalOffset.x,
    paragliderPosition.y + positions.finalOffset.y,
    paragliderPosition.z + positions.finalOffset.z
  );

  // Set initial camera position behind boats looking at them
  camera.position.copy(initialCameraPosition);
  camera.lookAt(boatCenterPosition);

  // Ensure controls are set up properly
  if (controls) {
    controls.target.copy(boatCenterPosition);
    controls.update();
    controls.enabled = false; // Disable controls during animation
  }

  let animatorInstance: any = null;

  // Start the modified camera animation
  const timeoutId = setTimeout(() => {
    if (callbacks.onAnimationStart) {
      callbacks.onAnimationStart();
    }

    animatorInstance = animator.animate(
      'boats-to-paragliders',
      ANIMATION_CONFIG.duration,
      (progress) => {
        let currentPosition;
        const { phases, speeds } = ANIMATION_CONFIG;

        if (progress < phases.boatFocus) {
          // Phase 1: Show boats prominently
          const phase1Progress = progress / phases.boatFocus;
          const easedProgress = phase1Progress * phase1Progress * (3 - 2 * phase1Progress);

          currentPosition = new THREE.Vector3().lerpVectors(
            initialCameraPosition,
            intermediatePosition,
            easedProgress * speeds.phase1Movement
          );

          const lookTarget = new THREE.Vector3().lerpVectors(
            boatCenterPosition,
            paragliderPosition,
            easedProgress * speeds.phase1LookShift
          );
          if (controls) {
            controls.target.copy(lookTarget);
            controls.update();
          }
        } else if (progress < phases.transition) {
          // Phase 2: Transition phase
          const phase2Start = phases.boatFocus;
          const phase2Duration = phases.transition - phases.boatFocus;
          const phase2Progress = (progress - phase2Start) / phase2Duration;
          const easedProgress = phase2Progress * phase2Progress * (3 - 2 * phase2Progress);

          currentPosition = new THREE.Vector3().lerpVectors(
            new THREE.Vector3().lerpVectors(
              initialCameraPosition,
              intermediatePosition,
              speeds.phase2Interpolation
            ),
            finalCameraPosition,
            easedProgress * speeds.phase2Movement
          );

          if (controls) {
            const targetProgress = Math.min(phase2Progress * 0.8, 1.0);
            const lookTarget = new THREE.Vector3().lerpVectors(
              controls.target,
              paragliderPosition,
              targetProgress * speeds.phase2LookShift
            );
            controls.target.copy(lookTarget);
            controls.update();
          }
        } else {
          // Phase 3: Final approach to paraglider
          const phase3Start = phases.transition;
          const phase3Duration = 1.0 - phases.transition;
          const phase3Progress = (progress - phase3Start) / phase3Duration;
          const easedProgress = 1 - Math.pow(1 - phase3Progress, 2.5);

          currentPosition = new THREE.Vector3().lerpVectors(
            new THREE.Vector3().lerpVectors(
              new THREE.Vector3().lerpVectors(
                initialCameraPosition,
                intermediatePosition,
                speeds.phase2Interpolation
              ),
              finalCameraPosition,
              speeds.phase2Movement
            ),
            finalCameraPosition,
            easedProgress
          );

          if (controls) {
            controls.target.lerpVectors(controls.target, paragliderPosition, speeds.phase3LookShift);
            controls.update();
          }
        }

        camera.position.copy(currentPosition);
      },
      () => {
        // Animation complete - enable controls
        if (controls) {
          controls.enabled = true;

          OrbitControlsHelper.focusOnTarget(
            controls,
            paragliderPosition,
            OrbitControlsHelper.createCenteredLimits(paragliderPosition, {
              ...ORBIT_CONTROLS_PRESETS['closeSubject'],
              minDistance: ANIMATION_CONFIG.controls.minDistance,
              maxDistance: ANIMATION_CONFIG.controls.maxDistance,
              panBoundary: {
                center: paragliderPosition,
                radius: ANIMATION_CONFIG.controls.panRadius,
                verticalScale: ANIMATION_CONFIG.controls.panVerticalScale,
              },
            })
          );
        }

        animatorInstance = null;

        if (callbacks.onAnimationComplete) {
          callbacks.onAnimationComplete();
        }
      }
    );
  }, 100);

  return {
    cleanup: () => {
      clearTimeout(timeoutId);
      if (animatorInstance) {
        animatorInstance = null;
      }
    },
  };
}

/**
 * Applies gentle floating motion to the camera
 */
export function applyFloatingMotion(
  camera: THREE.Camera,
  startTime: number,
  isAnimating: boolean
): void {
  if (isAnimating) {
    return;
  }

  const { floating } = ANIMATION_CONFIG;
  const time = (Date.now() - startTime) * floating.timeMultiplier;

  const floatY = Math.sin(time * floating.speed) * floating.amplitude;
  const floatX = Math.sin(time * floating.speed * 0.7) * (floating.amplitude * 0.3);
  const floatZ = Math.cos(time * floating.speed * 0.5) * (floating.amplitude * 0.2);

  camera.position.y += floatY * floating.dampening.y;
  camera.position.x += floatX * floating.dampening.x;
  camera.position.z += floatZ * floating.dampening.z;
}
