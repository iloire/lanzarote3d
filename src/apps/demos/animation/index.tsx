import * as THREE from "three";
import { update } from "@tweenjs/tween.js";
import { ParagliderVoxel } from "../../../foundation/components/vehicles";
import type { ParagliderVoxelOptions } from "../../../foundation/components/vehicles";
import Environment from "../../shared/env/environment";
import Weather, { WeatherOptions } from "../../../foundation/components/physics/Weather";
import adriModel from '../../../../assets/foundation/models/characters/adri.obj';
import adriTextureImage from '../../../../assets/foundation/models/characters/adri.png';
import { StoryOptions } from "../../shared/types";

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

    const initialCameraPosition = new THREE.Vector3(6760, 949, -461);
    const finalCameraPosition = new THREE.Vector3(
      pgPos.x - 200,
      pgPos.y + 90,
      pgPos.z + 450
    );

    camera.position.copy(initialCameraPosition);
    camera.lookAt(pgPos);

    camera.animateTo(finalCameraPosition,
      pgPos, 2000, controls, () => {
        camera.baseY = camera.position.y;
    });

    const animate = () => {
      requestAnimationFrame(animate);
      update(performance.now());
      renderer.render(scene, camera);
    };
    animate();

    // Animation app initialized
  }
};

export default Animation;