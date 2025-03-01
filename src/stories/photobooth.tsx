import * as THREE from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import Paraglider, { ParagliderOptions } from "../components/paraglider";
import ParagliderVoxel, { ParagliderVoxelOptions } from "../components/paraglider-voxel";
import Tandem from "../components/tandem";
import Camera from "../components/camera";
import { PilotHeadType } from "../components/parts/pilot-head";
import Environment from "./env/environment";
import Weather, { WeatherOptions } from "../elements/weather";
import adriModel from '../models/adri.obj';
import adriTextureImage from '../models/adri.png';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader';

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
        numeroCajones: 35
      },
      pilot: {
        pilot: {
          head: {
            headType: PilotHeadType.Default,
            helmetOptions: {
              color: '#ffff00',
              color2: '#cccccc',
              color3: '#999999'
            }
          }
        },
        passenger: {
          head: {
            headType: PilotHeadType.Default,
            helmetOptions: {
              color: '#ffffff',
              color2: '#cccccc',
              color3: '#999999'
            }
          },
          suitColor: 'red',
          suitColor2: 'green'
        },
      },
    },
    position: new THREE.Vector3(6837, 850, -535)
  }
];

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
  }];


type ParagliderConfig = {
  pg: ParagliderOptions,
  position: any
}

const paragliders: ParagliderConfig[] = [
  {
    pg: {
      glider: {
        wingColor1: '#c30010',
        wingColor2: '#b100cd',
        inletsColor: 'pink',
        numeroCajones: 35
      },
      pilot: {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999'
          }
        }
      },
    },
    position: new THREE.Vector3(6827, 860, -555)
  },
  {
    pg: {
      glider: {
        wingColor1: '#FFA500',
        wingColor2: '#b100cd',
        inletsColor: 'white',
        numeroCajones: 50
      },
      pilot: {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999'
          }
        }
      }
    },
    position: new THREE.Vector3(6727, 780, -555)
  },
  {
    pg: {
      glider: {
        wingColor1: '#FFA500',
        wingColor2: '#b100cd',
        inletsColor: '#333333',
        numeroCajones: 40
      },
      pilot: {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999'
          }
        }
      }
    },
    position: new THREE.Vector3(6777, 920, -535)
  },
  {
    pg: {
      glider: {
        wingColor1: '#FFA500',
        wingColor2: '#b100cd',
        inletsColor: 'pink',
        numeroCajones: 40
      },
      pilot: {
        head: {
          headType: PilotHeadType.Default,
          helmetOptions: {
            color: '#ffff00',
            color2: '#cccccc',
            color3: '#999999'
          }
        }
      }
    },
    position: new THREE.Vector3(6777, 920, -535)
  }
];

const PhotoBooth = {
  load: async (
    camera: Camera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
  ) => {
    const initialPos = new THREE.Vector3(6800, 870, -475);
    camera.animateTo(initialPos, paraglidersVoxel[0].position, 0);

    // Load font first
    const fontLoader = new FontLoader();
    const font = await new Promise<Font>((resolve) => {
      fontLoader.load('/fonts/helvetiker_regular.typeface.json', resolve);
    });

    // Helper function to create label
    const createLabel = (text: string, position: THREE.Vector3) => {
      const geometry = new TextGeometry(text, {
        font: font,
        size: 50,
        height: 5,
      });
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const textMesh = new THREE.Mesh(geometry, material);
      
      // Center the text
      geometry.computeBoundingBox();
      const centerOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
      textMesh.position.copy(position);
      textMesh.position.x += centerOffset;
      textMesh.position.y -= 200; // Position below the object
      
      return textMesh;
    };

    // Add labels for paragliders
    paragliders.forEach(async (p, index) => {
      const paraglider = new Paraglider(p.pg);
      const mesh = await paraglider.load();
      mesh.position.copy(p.position);
      const scale = 0.001;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      // Add label
      const label = createLabel(`Paraglider ${index + 1}`, p.position);
      scene.add(label);
    });

    // Add labels for voxel paragliders
    paraglidersVoxel.forEach(async (p, index) => {
      const paraglider = new ParagliderVoxel(p.pg);
      const mesh = await paraglider.load();
      mesh.position.copy(p.position);
      const scale = 0.01;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      // Add label
      const label = createLabel(`Voxel Paraglider ${index + 1}`, p.position);
      scene.add(label);
    });

    // Add labels for tandems
    tandems.forEach(async (p, index) => {
      const tandem = new Tandem(p.pg);
      const mesh = await tandem.load();
      mesh.position.copy(p.position);
      const scale = 0.001;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      // Add label
      const label = createLabel(`Tandem ${index + 1}`, p.position);
      scene.add(label);
    });

    // must render before adding env
    renderer.render(scene, camera);

    const env = new Environment(scene);
    const weather = new Weather(WEATHER_SETTINGS);
    const thermals = env.generateThermals(weather, 0);
    const cloudOptions = { colors: ['#F64A8A', '#F987C5', '#DE3163'] }

    env.addClouds(weather, thermals, cloudOptions);
    env.addTrees(terrain);
    env.addHouses(terrain);
    env.addBoats(water);

    const animate = () => {
      TWEEN.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  },
};

export default PhotoBooth;
