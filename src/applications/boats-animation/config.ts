import * as THREE from 'three';
import type { ParagliderVoxelOptions } from '../../foundation/components/vehicles';
import adriModel from '../../../assets/foundation/models/characters/adri/adri.obj';
import adriTextureImage from '../../../assets/foundation/models/characters/adri/adri.png';

export type ParagliderVoxelConfig = {
  pg: ParagliderVoxelOptions;
  position: THREE.Vector3;
};

export type CameraPositionPreset = 'closeUp' | 'overhead' | 'waterLevel' | 'custom';

export interface AnimationConfig {
  // Enable/disable camera animation
  enableAnimation: boolean;

  // Static camera configuration (used when enableAnimation = false)
  staticMode: {
    position: CameraPositionPreset;
    enableControls: boolean;
    customPosition: { x: number; y: number; z: number };
    customLookAt: { x: number; y: number; z: number };
  };

  // Timing settings
  duration: number;

  // Phase timing (as percentages of total duration)
  phases: {
    boatFocus: number;
    transition: number;
  };

  // Camera positions
  positions: {
    initial: { x: number; y: number; z: number };
    boatCenter: { x: number; y: number; z: number };
    intermediate: { x: number; y: number; z: number };
    finalOffset: { x: number; y: number; z: number };
    static: {
      closeUp: { x: number; y: number; z: number };
      overhead: { x: number; y: number; z: number };
      waterLevel: { x: number; y: number; z: number };
    };
  };

  // Movement speed multipliers
  speeds: {
    phase1Movement: number;
    phase1LookShift: number;
    phase2Movement: number;
    phase2Interpolation: number;
    phase2LookShift: number;
    phase3LookShift: number;
  };

  // Camera floating effect
  floating: {
    amplitude: number;
    speed: number;
    timeMultiplier: number;
    dampening: {
      y: number;
      x: number;
      z: number;
    };
  };

  // Control settings
  controls: {
    minDistance: number;
    maxDistance: number;
    panRadius: number;
    panVerticalScale: number;
  };
}

// ==========================================
// ANIMATION CONFIGURATION - Easy to tweak!
// ==========================================
// To disable animation and use static camera:
// 1. Set enableAnimation: false
// 2. Choose staticMode.position: 'closeUp', 'overhead', 'waterLevel', or 'custom'
// 3. If using 'custom', set customPosition and customLookAt coordinates
// 4. Set staticMode.enableControls: true to allow manual camera navigation
export const ANIMATION_CONFIG: AnimationConfig = {
  // Enable/disable camera animation
  enableAnimation: false, // Set to false for static camera positioned close to boats

  // Static camera configuration (used when enableAnimation = false)
  staticMode: {
    // Choose preset position or use 'custom' for manual positioning
    position: 'custom',
    enableControls: true, // Allow user to manually navigate with orbit controls

    // Custom camera positioning (used when position = 'custom')
    customPosition: { x: 7840, y: 24, z: -5100 }, // Camera position
    customLookAt: { x: 7900, y: 30, z: -5200 }, // Where camera looks (default: boat center)
  },

  // Timing settings
  duration: 18000, // Total animation duration in milliseconds

  // Phase timing (as percentages of total duration)
  phases: {
    boatFocus: 0.2, // 20% - First phase showing boats prominently
    transition: 0.3, // 30% - End of transition phase
    // Final phase (paraglider focus) is from 30% to 100%
  },

  // Camera positions (Three.js Vector3 coordinates)
  positions: {
    initial: { x: 8200, y: 80, z: -6200 }, // Behind boats at water level
    boatCenter: { x: 7900, y: 30, z: -5200 }, // Center of boat area (look target)
    intermediate: { x: 7200, y: 400, z: -3000 }, // Rising toward paraglider area
    // Final position is calculated relative to paraglider: pgPos + finalOffset
    finalOffset: { x: -100, y: 50, z: 200 }, // Offset from paraglider position

    // Static camera positions (used when enableAnimation = false)
    static: {
      closeUp: { x: 7900, y: 70, z: -5120 }, // Close to boats, slightly elevated
      overhead: { x: 7900, y: 150, z: -5200 }, // Overhead view of boats
      waterLevel: { x: 7900, y: 20, z: -5100 }, // At water level, very close
    },
  },

  // Movement speed multipliers (lower = slower movement)
  speeds: {
    phase1Movement: 0.05, // How fast camera moves in phase 1 (boats focus)
    phase1LookShift: 0.05, // How fast look target shifts in phase 1
    phase2Movement: 0.1, // Movement speed in transition phase
    phase2Interpolation: 0.15, // Interpolation factor for phase 2 intermediate position
    phase2LookShift: 0.15, // Look target shift speed in phase 2
    phase3LookShift: 0.08, // Final phase look target adjustment speed
  },

  // Camera floating effect (after animation completes)
  floating: {
    amplitude: 0, // Floating amplitude
    speed: 1.2, // Floating speed multiplier
    timeMultiplier: 0.0005, // Time scaling for floating calculations
    dampening: {
      y: 0.02, // Y-axis floating dampening
      x: 0.01, // X-axis floating dampening
      z: 0.01, // Z-axis floating dampening
    },
  },

  // Control settings after animation
  controls: {
    minDistance: 50,
    maxDistance: 1500,
    panRadius: 500,
    panVerticalScale: 0.5,
  },
};

// Paragliders configuration - same as original animation but positioned to work well with boats camera
export const paraglidersVoxel: ParagliderVoxelConfig[] = [
  {
    pg: {
      glider: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        inletsColor: 'pink',
        numeroCajones: 35,
      },
      pilot: {
        objFile: adriModel,
        textureFile: adriTextureImage,
      },
    },
    position: new THREE.Vector3(6897, 920, -705),
  },
];

// Bird path configuration
export const birdPath = [
  new THREE.Vector3(5000, 1000, 0),
  new THREE.Vector3(6000, 1100, -500),
  new THREE.Vector3(7000, 1200, -1000),
  new THREE.Vector3(8000, 1000, -500),
  new THREE.Vector3(7000, 900, 0),
];
