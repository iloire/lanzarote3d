import * as THREE from 'three';
import { Paraglider, ParagliderOptions } from '../../../foundation/components/vehicles';
import ParagliderVoxel, {
  ParagliderVoxelOptions,
} from '../../../foundation/components/vehicles/ParagliderVoxel';
import Tandem from '../../../foundation/components/vehicles/Tandem';
import { PilotHeadType } from '../../../foundation/components/characters/PilotHead';
import Environment from '../../shared/env/environment';
import Weather, { WeatherOptions } from '../../../foundation/components/physics/Weather';
import adriModel from '../../../../assets/foundation/models/characters/adri.obj';
import adriTextureImage from '../../../../assets/foundation/models/characters/adri.png';
import { StoryOptions } from '../../shared/types';

const WEATHER_SETTINGS: WeatherOptions = {
  windDirectionDegreesFromNorth: 310,
  speedMetresPerSecond: 18 / 3.6,
  lclLevel: 1800,
};

const tandems = [
  {
    pg: {
      glider: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        breakColor: '#ffffff',
        lineFrontColor: '#ffffff',
        lineBackColor: '#ffffff',
        inletsColor: '#333333',
        numeroCajones: 35,
      },
      pilot: {
        pilot: {
          head: {
            headType: PilotHeadType.Default,
            helmetOptions: {
              color: '#ffff00',
              color2: '#cccccc',
              color3: '#999999',
            },
          },
        },
        passenger: {
          head: {
            headType: PilotHeadType.Default,
            helmetOptions: {
              color: '#ffffff',
              color2: '#cccccc',
              color3: '#999999',
            },
          },
          suitColor: 'red',
          suitColor2: 'green',
        },
      },
    },
    position: new THREE.Vector3(6837, 850, -535),
  },
];

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

type ParagliderConfig = {
  pg: ParagliderOptions;
  position: any;
};

const paragliders: ParagliderConfig[] = [
  {
    pg: {
      glider: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        inletsColor: 'pink',
        numeroCajones: 35,
      },
      pilot: {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999',
          },
        },
      },
    },
    position: new THREE.Vector3(6827, 860, -555),
  },
  {
    pg: {
      glider: {
        wingColor1: '#FFA500',
        wingColor2: '#b100cd',
        inletsColor: 'white',
        numeroCajones: 50,
      },
      pilot: {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999',
          },
        },
      },
    },
    position: new THREE.Vector3(6727, 780, -555),
  },
  {
    pg: {
      glider: {
        wingColor1: '#FFA500',
        wingColor2: '#b100cd',
        inletsColor: '#333333',
        numeroCajones: 40,
      },
      pilot: {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999',
          },
        },
      },
    },
    position: new THREE.Vector3(6777, 920, -535),
  },
  {
    pg: {
      glider: {
        wingColor1: '#FFA500',
        wingColor2: '#b100cd',
        inletsColor: 'pink',
        numeroCajones: 40,
      },
      pilot: {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999',
          },
        },
      },
    },
    position: new THREE.Vector3(6777, 920, -535),
  },
];

const PhotoBooth = {
  load: async (options: StoryOptions) => {
    const { camera, scene, renderer, terrain, water, controls } = options;

    controls.enabled = true;

    const initialPos = new THREE.Vector3(6200, 970, 175);
    const lookAtPos = paraglidersVoxel[0]?.position || new THREE.Vector3();

    // Set camera position and look at target

    // Set camera position directly since duration is 0
    camera.position.copy(initialPos);
    camera.lookAt(lookAtPos);
    controls.target.copy(lookAtPos);
    controls.update();

    // Add paragliders
    paragliders.forEach(async p => {
      const paraglider = new Paraglider(p.pg);
      const mesh = await paraglider.load();
      mesh.position.copy(p.position);
      const scale = 0.001;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);
      // Regular paraglider added
    });

    // Add voxel paragliders
    paraglidersVoxel.forEach(async p => {
      const paraglider = new ParagliderVoxel(p.pg);
      const mesh = await paraglider.load();
      mesh.position.copy(p.position);
      const scale = 0.01;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);
      // Voxel paraglider added
    });

    // Add tandems
    tandems.forEach(async p => {
      const tandem = new Tandem(p.pg);
      const mesh = await tandem.load();
      mesh.position.copy(p.position);
      const scale = 0.001;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);
      // Tandem added
    });

    // must render before adding env
    renderer.render(scene, camera);

    // Set up environment
    const env = new Environment(scene);
    const weather = new Weather(WEATHER_SETTINGS);
    const thermals = env.generateThermals(weather, 0);
    const cloudOptions = { colors: ['#F64A8A', '#F987C5', '#DE3163'] };

    // Add environment elements
    env.addClouds(thermals, cloudOptions);
    env.addTrees(terrain);
    env.addHouses(terrain);
    env.addBoats(water);

    const animate = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  },
};

export default PhotoBooth;
