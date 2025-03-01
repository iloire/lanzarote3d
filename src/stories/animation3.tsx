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

const Animation3 = {
  load: async (
    camera: Camera,
    scene: THREE.Scene,
    renderer,
    terrain: THREE.Mesh,
    water: THREE.Mesh,
  ) => {
    const initialPos = new THREE.Vector3(6800, 870, -475);
    camera.animateTo(initialPos, paraglidersVoxel[0].position, 0);

    // Helper function to get terrain height at a position
    const getTerrainHeightAt = (x: number, z: number) => {
      const raycaster = new THREE.Raycaster();
      raycaster.ray.direction.set(0, -1, 0);
      raycaster.ray.origin.set(x, 1000, z);
      const intersects = raycaster.intersectObject(terrain);
      return intersects.length > 0 ? intersects[0].point.y : 0;
    };

    // Function to create a figure-8 flight path
    const createFigure8Path = (startPos: THREE.Vector3, radius: number = 25) => {
      const points: THREE.Vector3[] = [];
      const numPoints = 16; // More points for smoother figure-8
      
      for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * Math.PI * 2;
        // Figure-8 parametric equations
        const x = startPos.x + radius * Math.cos(t);
        const z = startPos.z + radius * Math.sin(t) * Math.cos(t);
        const terrainHeight = getTerrainHeightAt(x, z);
        // Add slight height variation
        const heightVariation = Math.sin(t * 2) * 10;
        const y = Math.max(terrainHeight + 70, startPos.y + heightVariation);
        points.push(new THREE.Vector3(x, y, z));
      }
      points.push(points[0]); // Close the loop
      return points;
    };

    // Add paragliders with animation
    paragliders.forEach(async (p) => {
      const paraglider = new Paraglider(p.pg);
      const mesh = await paraglider.load();
      mesh.position.copy(p.position);
      const scale = 0.001;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      // Create flight path
      const flightPath = createFigure8Path(p.position);
      let currentPoint = 0;

      // Create animation
      const animateParglider = () => {
        const nextPoint = (currentPoint + 1) % flightPath.length;
        const currentPos = flightPath[currentPoint];
        const targetPos = flightPath[nextPoint];

        // Calculate direction while maintaining vertical orientation
        const direction = new THREE.Vector3()
          .subVectors(targetPos, mesh.position)
          .normalize();
        
        // Create rotation that only affects Y-axis (heading)
        const targetRotation = Math.atan2(direction.x, direction.z);
        const euler = new THREE.Euler(0, targetRotation, 0, 'YXZ');
        const targetQuaternion = new THREE.Quaternion().setFromEuler(euler);

        // Rotate first, then move
        new TWEEN.Tween(mesh.quaternion)
          .to(targetQuaternion, 2000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .start();

        new TWEEN.Tween(mesh.position)
          .to(targetPos, 15000) // Much slower movement (15 seconds per segment)
          .easing(TWEEN.Easing.Linear.None) // Linear movement for constant speed
          .onComplete(() => {
            currentPoint = nextPoint;
            animateParglider();
          })
          .start();
      };

      // Start animation with random delay
      setTimeout(() => animateParglider(), Math.random() * 2000);
    });

    // Add voxel paragliders with animation
    paraglidersVoxel.forEach(async (p) => {
      const paraglider = new ParagliderVoxel(p.pg);
      const mesh = await paraglider.load();
      mesh.position.copy(p.position);
      const scale = 0.01;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      // Camera follow parameters
      const cameraOffset = new THREE.Vector3(-30, 20, -30); // Offset from paraglider
      const cameraLookAhead = 30; // How far ahead to look

      // Function to update camera position
      const updateCamera = (targetPos: THREE.Vector3, direction: THREE.Vector3) => {
        // Calculate desired camera position based on paraglider position and offset
        const desiredCameraPos = targetPos.clone().add(cameraOffset);
        
        // Calculate look-at point ahead of the paraglider
        const lookAtPoint = targetPos.clone().add(direction.multiplyScalar(cameraLookAhead));

        // Smoothly move camera
        new TWEEN.Tween(camera.position)
          .to(desiredCameraPos, 1000)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start();

        // Smoothly rotate camera
        camera.lookAt(lookAtPoint);
      };

      // Create figure-8 flight path
      const flightPath = createFigure8Path(p.position);
      let currentPoint = 0;

      // Create animation
      const animateVoxelParaglider = () => {
        const nextPoint = (currentPoint + 1) % flightPath.length;
        const currentPos = flightPath[currentPoint];
        const targetPos = flightPath[nextPoint];

        // Calculate direction for both paraglider and camera
        const direction = new THREE.Vector3()
          .subVectors(targetPos, mesh.position)
          .normalize();

        // Create rotation that only affects Y-axis (heading)
        const targetRotation = Math.atan2(direction.x, direction.z);
        const euler = new THREE.Euler(0, targetRotation, 0, 'YXZ');
        const targetQuaternion = new THREE.Quaternion().setFromEuler(euler);

        // Remove banking effect and keep vertical
        new TWEEN.Tween(mesh.quaternion)
          .to(targetQuaternion, 3000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .start();

        new TWEEN.Tween(mesh.position)
          .to(targetPos, 20000)
          .easing(TWEEN.Easing.Linear.None)
          .onUpdate(() => {
            updateCamera(mesh.position, direction);
          })
          .onComplete(() => {
            currentPoint = nextPoint;
            animateVoxelParaglider();
          })
          .start();
      };

      // Start animation with small initial delay
      setTimeout(() => animateVoxelParaglider(), 500);
    });

    // Add tandems
    tandems.forEach(async (p) => {
      const tandem = new Tandem(p.pg);
      const mesh = await tandem.load();
      mesh.position.copy(p.position);
      const scale = 0.001;
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);
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

export default Animation3;
