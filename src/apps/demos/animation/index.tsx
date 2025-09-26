import * as THREE from "three";
import { ParagliderVoxel } from "../../../foundation/components/vehicles";
import type { ParagliderVoxelOptions } from "../../../foundation/components/vehicles";
import Environment from "../../shared/env/environment";
import Weather, { WeatherOptions } from "../../../foundation/components/physics/Weather";
import adriModel from '../../../../assets/foundation/models/characters/adri.obj';
import adriTextureImage from '../../../../assets/foundation/models/characters/adri.png';
import { StoryOptions } from "../../shared/types";
import AnimationManager from "../../../foundation/systems/animation/AnimationManager";
import { animator } from "../../../foundation/systems/animation/SimpleAnimator";

const WEATHER_SETTINGS: WeatherOptions = {
  windDirectionDegreesFromNorth: 310,
  speedMetresPerSecond: 18 / 3.6,
  lclLevel: 1800,
};

type ParagliderVoxelConfig = {
  pg: ParagliderVoxelOptions,
  position: any
}

const paraglidersVoxel: ParagliderVoxelConfig[] = [
  {
    pg: {
      glider: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        inletsColor: 'pink',
        numeroCajones: 35
      },
      pilot: {
        objFile: adriModel,
        textureFile: adriTextureImage
      },
    },
    position: new THREE.Vector3(6897, 920, -705)
  }
];

/**
 * Animation App - Restored original animation with voxel paraglider
 */
const Animation = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, controls } = options;

    // Add voxel paragliders
    paraglidersVoxel.forEach(async (p) => {
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
    const cloudOptions = { colors: ['#F64A8A', '#F987C5', '#DE3163'] }

    env.addClouds(thermals, cloudOptions);
    env.addTrees(terrain);
    env.addHouses(terrain);
    env.addBoats(water);

    const pgPos = paraglidersVoxel[0]?.position.clone() || new THREE.Vector3();
    console.log('Paraglider position:', pgPos);

    // Starting position - further away from the paraglider
    const initialCameraPosition = new THREE.Vector3(6500, 1100, -200);

    // Final position - closer to the paraglider
    const finalCameraPosition = new THREE.Vector3(
      pgPos.x - 100,  // Closer than before
      pgPos.y + 50,   // Slightly above
      pgPos.z + 200   // Behind the paraglider
    );

    console.log('Initial camera position:', initialCameraPosition);
    console.log('Final camera position:', finalCameraPosition);

    // Set initial camera position and look at the paraglider
    camera.position.copy(initialCameraPosition);
    camera.lookAt(pgPos);

    // Ensure controls are set up properly
    if (controls) {
      controls.target.copy(pgPos);
      controls.update();
      controls.enabled = false; // Disable controls during animation
    }

    // Register animation app with centralized manager first to ensure TWEEN loop is running
    AnimationManager.register('animation-demo-render', () => {
      renderer.render(scene, camera);
    }, 50); // Lower priority than stats but higher than other apps

    // Start the camera animation after a short delay to ensure everything is loaded
    setTimeout(() => {
      console.log('Starting simple camera animation...');
      console.log('From:', camera.position.x.toFixed(1), camera.position.y.toFixed(1), camera.position.z.toFixed(1));
      console.log('To:', finalCameraPosition.x.toFixed(1), finalCameraPosition.y.toFixed(1), finalCameraPosition.z.toFixed(1));

      // Store initial positions
      const startPosition = camera.position.clone();
      const startTarget = controls ? controls.target.clone() : pgPos.clone();

      // Simple, clear animation with no dependencies
      animator.animate('camera-move', 8000, (progress) => {
        // Interpolate camera position
        camera.position.lerpVectors(startPosition, finalCameraPosition, progress);

        // Interpolate look target
        if (controls) {
          controls.target.lerpVectors(startTarget, pgPos, progress);
          controls.update();
        }

        // Debug output every 10%
        if (Math.floor(progress * 10) !== Math.floor((progress - 0.01) * 10)) {
          console.log(`Camera animation ${Math.floor(progress * 100)}%:`,
            camera.position.x.toFixed(1), camera.position.y.toFixed(1), camera.position.z.toFixed(1));
        }
      }, () => {
        // Animation complete
        if (controls) {
          controls.enabled = true;
        }
        console.log('Camera animation complete!');
      });
    }, 100);

    // Animation app initialized
  }
};

export default Animation;