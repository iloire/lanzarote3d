import * as THREE from 'three';
import { ParagliderVoxel } from '../../../foundation/components/vehicles';
import type { ParagliderVoxelOptions } from '../../../foundation/components/vehicles';
import Environment from '../../shared/env/environment';
import Weather, { WeatherOptions } from '../../../foundation/components/physics/Weather';
import adriModel from '../../../../assets/foundation/models/characters/adri.obj';
import adriTextureImage from '../../../../assets/foundation/models/characters/adri.png';
import { StoryOptions } from '../../shared/types';
import { animator } from '../../../foundation/systems/animation/SimpleAnimator';

const WEATHER_SETTINGS: WeatherOptions = {
  windDirectionDegreesFromNorth: 310,
  speedMetresPerSecond: 18 / 3.6,
  lclLevel: 1800,
};

type ParagliderVoxelConfig = {
  pg: ParagliderVoxelOptions;
  position: any;
};

const paraglidersVoxel: ParagliderVoxelConfig[] = [
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

/**
 * Animation App - Restored original animation with voxel paraglider
 */
const Animation = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, controls } = options;

    // Add voxel paragliders
    paraglidersVoxel.forEach(async p => {
      const paraglider = new ParagliderVoxel(p.pg);
      const mesh = await paraglider.load();
      mesh.position.copy(p.position);
      const scale = 0.01;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);
    });

    // must render before adding env
    renderer.render(scene, camera);

    const env = new Environment(scene);
    const weather = new Weather(WEATHER_SETTINGS);
    const thermals = env.generateThermals(weather, 0);
    const cloudOptions = { colors: ['#F64A8A', '#F987C5', '#DE3163'] };

    env.addClouds(thermals, cloudOptions);
    env.addTrees(terrain);
    env.addHouses(terrain);
    env.addBoats(water);

    const pgPos = paraglidersVoxel[0]?.position.clone() || new THREE.Vector3();

    // Starting position - extremely far away on the other side of the island
    const initialCameraPosition = new THREE.Vector3(-2000, 2500, 5000);

    // Intermediate position - approaching the area quickly
    const intermediatePosition = new THREE.Vector3(4500, 1600, 1500);

    // Final position - slow, careful approach to the paraglider
    const finalCameraPosition = new THREE.Vector3(
      pgPos.x - 100, // Close to paraglider
      pgPos.y + 50, // Slightly above
      pgPos.z + 200 // Behind the paraglider
    );

    // Set initial camera position and look at the paraglider
    camera.position.copy(initialCameraPosition);
    camera.lookAt(pgPos);

    // Ensure controls are set up properly
    if (controls) {
      controls.target.copy(pgPos);
      controls.update();
      controls.enabled = false; // Disable controls during animation
    }

    // Simple, direct rendering loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Start the dramatic two-phase camera animation
    setTimeout(() => {
      // Store initial positions
      const startTarget = controls ? controls.target.clone() : pgPos.clone();

      // Single seamless animation with custom easing (8 seconds total)
      animator.animate(
        'camera-seamless',
        8000,
        progress => {
          let currentPosition;

          if (progress < 0.35) {
            // Phase 1: Fast approach (first 35% = 2.8 seconds)
            const phase1Progress = progress / 0.35; // 0-1 for first phase
            // Use smooth acceleration with gentle end
            const easedProgress = phase1Progress * phase1Progress * (3 - 2 * phase1Progress); // smoothstep
            currentPosition = new THREE.Vector3().lerpVectors(
              initialCameraPosition,
              intermediatePosition,
              easedProgress
            );

            // Look towards the area gradually
            const lookTarget = new THREE.Vector3().lerpVectors(
              startTarget,
              pgPos,
              easedProgress * 0.6
            );
            if (controls) {
              controls.target.copy(lookTarget);
              controls.update();
            }
          } else {
            // Phase 2: Slow approach (last 65% = 5.2 seconds)
            const phase2Progress = (progress - 0.35) / 0.65; // 0-1 for second phase
            // Use very smooth decelerated easing that connects perfectly
            const easedProgress = 1 - Math.pow(1 - phase2Progress, 2.5); // smooth deceleration
            currentPosition = new THREE.Vector3().lerpVectors(
              intermediatePosition,
              finalCameraPosition,
              easedProgress
            );

            // Gradually focus on the paraglider with smooth transition
            if (controls) {
              const targetProgress = Math.min(phase2Progress * 1.5, 1.0); // More gradual targeting
              controls.target.lerpVectors(controls.target, pgPos, targetProgress * 0.05); // Very smooth
              controls.update();
            }
          }

          camera.position.copy(currentPosition);
        },
        () => {
          // Animation complete
          if (controls) {
            controls.enabled = true;
          }
        }
      );
    }, 100);

    // Animation app initialized
  },
};

export default Animation;
